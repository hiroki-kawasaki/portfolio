#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

readonly APP_STAGE="${1:-dev}"

if [ "$APP_STAGE" != 'dev' ] && [ "$APP_STAGE" != 'stg' ] && [ "$APP_STAGE" != 'prd' ]; then
    echo "The first argument must be one of 'dev', 'stg' or 'prd'." >&2
    exit 1
fi

aws_command=("aws")
if [ "$APP_STAGE" != 'dev' ]; then
    aws_command+=("--profile" "$APP_STAGE")
fi

echo "Application Satge: $APP_STAGE"

if [ "$APP_STAGE" = 'prd' ]; then
    read -p 'You are about to deploy to the production environment. Are you sure? (y/N): ' answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
        echo 'Deployment aborted.'
        exit 0
    fi
fi

readonly VERSION=$(date +%Y%m%d)

readonly BASE_KEY_PATH="/portfolio-web/keys"
readonly LATEST_VERSION_PATH="/portfolio-web/keys/latest-version"
readonly ACTIVE_VERSIONS_PATH="/portfolio-web/keys/active-version"

readonly MAX_GENERATIONS=5
readonly TAGS="Key=application-group-name,Value=portfolio Key=application-name,Value=portfolio-web Key=application-stage,Value=$APP_STAGE"

readonly RSA_PRIVATE_KEY_FILE="private_key.pem"
readonly RSA_PUBLIC_KEY_FILE="public_key.pem"
readonly AES_KEY_FILE="aes_key.hex"

trap 'rm -f "$RSA_PRIVATE_KEY_FILE" "$RSA_PUBLIC_KEY_FILE" "$AES_KEY_FILE"' EXIT

echo "Fetching current active versions from SSM..."
CURRENT_ACTIVE_VERSIONS=$("${aws_command[@]}" ssm get-parameter --name "$ACTIVE_VERSIONS_PATH" | jq -r '.Parameter.Value' || echo "")

if [[ ",$CURRENT_ACTIVE_VERSIONS," == *",$VERSION,"* ]]; then
    echo "Keys for today's version ($VERSION) already exist. Exiting."
    exit 0
fi

echo "Generating keys for version $VERSION..."
echo "  -> Generating 4096-bit RSA key pair..."
openssl genpkey -algorithm RSA -out "$RSA_PRIVATE_KEY_FILE" -pkeyopt rsa_keygen_bits:4096 &> /dev/null
openssl rsa -pubout -in "$RSA_PRIVATE_KEY_FILE" -out "$RSA_PUBLIC_KEY_FILE" &> /dev/null

echo "  -> Generating 256-bit AES key (HEX)..."
openssl rand -hex 32 > "$AES_KEY_FILE"
echo "Key generation complete."

SSM_RSA_PRIVATE_KEY_NAME="${BASE_KEY_PATH}/${VERSION}/rsa256/private-key"
SSM_RSA_PUBLIC_KEY_NAME="${BASE_KEY_PATH}/${VERSION}/rsa256/public-key"
SSM_AES_KEY_NAME="${BASE_KEY_PATH}/${VERSION}/aes256gcm/symmetric-key"

echo "Uploading and tagging new keys in SSM..."
"${aws_command[@]}" ssm put-parameter \
    --name "$SSM_RSA_PRIVATE_KEY_NAME" \
    --value "file://$RSA_PRIVATE_KEY_FILE" \
    --type "SecureString" \
    --description "Portfolio Managed Console - WEB / RSA Private Key for data encryption. Version: $VERSION" \
    --overwrite > /dev/null
"${aws_command[@]}" ssm add-tags-to-resource --resource-type "Parameter" --resource-id "$SSM_RSA_PRIVATE_KEY_NAME" --tags $TAGS > /dev/null

"${aws_command[@]}" ssm put-parameter \
    --name "$SSM_RSA_PUBLIC_KEY_NAME" \
    --value "file://$RSA_PUBLIC_KEY_FILE" \
    --type "String" \
    --description "Portfolio Managed Console - WEB / RSA Public Key for data encryption. Version: $VERSION" \
    --overwrite > /dev/null
"${aws_command[@]}" ssm add-tags-to-resource --resource-type "Parameter" --resource-id "$SSM_RSA_PUBLIC_KEY_NAME" --tags $TAGS > /dev/null

"${aws_command[@]}" ssm put-parameter \
    --name "$SSM_AES_KEY_NAME" \
    --value "file://$AES_KEY_FILE" \
    --type "SecureString" \
    --description "Portfolio Managed Console - WEB / AES-256-GCM Symmetric Key for data encryption. Version: $VERSION" \
    --overwrite > /dev/null
"${aws_command[@]}" ssm add-tags-to-resource --resource-type "Parameter" --resource-id "$SSM_AES_KEY_NAME" --tags $TAGS > /dev/null
echo "  -> Uploaded and tagged 3 new keys for version $VERSION."

if [ -z "$CURRENT_ACTIVE_VERSIONS" ]; then
    NEW_ACTIVE_VERSIONS="$VERSION"
else
    NEW_ACTIVE_VERSIONS="$CURRENT_ACTIVE_VERSIONS,$VERSION"
fi

IFS=',' read -r -a versions_array <<< "$NEW_ACTIVE_VERSIONS"
FINAL_ACTIVE_VERSIONS="$NEW_ACTIVE_VERSIONS"

if [ "${#versions_array[@]}" -gt "$MAX_GENERATIONS" ]; then
    VERSION_TO_DELETE=${versions_array[0]}
    echo "Maximum generations ($MAX_GENERATIONS) exceeded. Deleting oldest version: $VERSION_TO_DELETE"
    
    DELETE_RSA_PRIVATE_PATH="${BASE_KEY_PATH}/${VERSION_TO_DELETE}/rsa256/private-key"
    DELETE_RSA_PUBLIC_PATH="${BASE_KEY_PATH}/${VERSION_TO_DELETE}/rsa256/public-key"
    DELETE_AES_PATH="${BASE_KEY_PATH}/${VERSION_TO_DELETE}/aes256gcm/symmetric-key"
    
    "${aws_command[@]}" ssm delete-parameter --name "$DELETE_RSA_PRIVATE_PATH" > /dev/null
    "${aws_command[@]}" ssm delete-parameter --name "$DELETE_RSA_PUBLIC_PATH" > /dev/null
    "${aws_command[@]}" ssm delete-parameter --name "$DELETE_AES_PATH" > /dev/null
    echo "  -> Deleted 3 old keys from SSM."
    
    updated_versions_array=("${versions_array[@]:1}")
    FINAL_ACTIVE_VERSIONS=$(IFS=, ; echo "${updated_versions_array[*]}")
fi

echo "Updating and tagging version management parameters in SSM..."
"${aws_command[@]}" ssm put-parameter \
    --name "$ACTIVE_VERSIONS_PATH" \
    --value "$FINAL_ACTIVE_VERSIONS" \
    --type "String" \
    --description "Portfolio Managed Console - WEB / Comma-separated list of active key versions." \
    --overwrite > /dev/null
"${aws_command[@]}" ssm add-tags-to-resource --resource-type "Parameter" --resource-id "$ACTIVE_VERSIONS_PATH" --tags $TAGS > /dev/null
echo "  -> Active versions: $FINAL_ACTIVE_VERSIONS"

"${aws_command[@]}" ssm put-parameter \
    --name "$LATEST_VERSION_PATH" \
    --value "$VERSION" \
    --type "String" \
    --description "Portfolio Managed Console - WEB / The most recent key version." \
    --overwrite > /dev/null
"${aws_command[@]}" ssm add-tags-to-resource --resource-type "Parameter" --resource-id "$LATEST_VERSION_PATH" --tags $TAGS > /dev/null
echo "  -> Latest version: $VERSION"

echo "Cleaning up temporary files..."
echo "All tasks completed successfully."