#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

readonly ENV_TYPE="${1:-}"

readonly BASE_KEY_PATH="/portfolio-web/keys"
readonly LATEST_VERSION_PATH="/portfolio-web/keys/latest-version"
readonly ACTIVE_VERSIONS_PATH="/portfolio-web/keys/active-version"

ENV_FILE=".env"
if [ -n "$ENV_TYPE" ]; then
    ENV_FILE=".env.$ENV_TYPE"
fi

> "$ENV_FILE"

echo "Creating $ENV_FILE"
echo "Fetching parameters from AWS SSM..."

{
    APP_STAGE=$(aws ssm get-parameter --name /account/application-stage | jq -r '.Parameter.Value')
    echo "APP_STAGE=$APP_STAGE"

    COGNITO_DOMAIN="auth"
    if [ "$APP_STAGE" != 'prd' ]; then
        COGNITO_DOMAIN+=".${APP_STAGE}"
    fi
    COGNITO_DOMAIN+=".portfolio.com"
    echo "COGNITO_DOMAIN=https://$COGNITO_DOMAIN"

    COGNITO_CLIENT_ID=$(aws ssm get-parameter --name /portfolio-id/cognito/userpool-client-id | jq -r '.Parameter.Value')
    echo "COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID"

    USER_POOL_ID=$(aws ssm get-parameter --name /portfolio-id/cognito/userpool-id | jq -r '.Parameter.Value')
    COGNITO_SECRET=$(aws cognito-idp describe-user-pool-client --user-pool-id "$USER_POOL_ID" --client-id "$COGNITO_CLIENT_ID" | jq -r '.UserPoolClient.ClientSecret')
    echo "COGNITO_SECRET=$COGNITO_SECRET"
} >> "$ENV_FILE"

ACTIVE_VERSIONS=$(aws ssm get-parameter --name "$ACTIVE_VERSIONS_PATH" | jq -r '.Parameter.Value' || echo "")
LATEST_VERSION=$(aws ssm get-parameter --name "$LATEST_VERSION_PATH" | jq -r '.Parameter.Value' || echo "")

if [ -z "$ACTIVE_VERSIONS" ]; then
    echo "Warning: No active key versions found in SSM."
    echo "Successfully created $ENV_FILE"
    exit 0
fi

{
    echo ""
    echo "# Key Version Management"
    echo "KEY_VERSIONS=$ACTIVE_VERSIONS"
    echo "LATEST_KEY_VERSION=$LATEST_VERSION"
} >> "$ENV_FILE"

echo "  -> Fetching all active key generations: $ACTIVE_VERSIONS"

IFS=',' read -r -a versions_array <<< "$ACTIVE_VERSIONS"
for version in "${versions_array[@]}"; do
    echo "    -> Fetching keys for version: $version"
    RSA_PRIVATE_KEY_PATH="${BASE_KEY_PATH}/${version}/rsa256/private-key"
    RSA_PUBLIC_KEY_PATH="${BASE_KEY_PATH}/${version}/rsa256/public-key"
    AES_KEY_PATH="${BASE_KEY_PATH}/${version}/aes256gcm/symmetric-key"

    RSA_PRIVATE_KEY=$(aws ssm get-parameter --name "$RSA_PRIVATE_KEY_PATH" --with-decryption | jq -r '.Parameter.Value')
    RSA_PUBLIC_KEY=$(aws ssm get-parameter --name "$RSA_PUBLIC_KEY_PATH" | jq -r '.Parameter.Value')
    AES_SYMMETRIC_KEY=$(aws ssm get-parameter --name "$AES_KEY_PATH" --with-decryption | jq -r '.Parameter.Value')

    {
        echo ""
        echo "# Keys for version: $version"
        printf 'RSA_PRIVATE_KEY_%s="%s"\n' "$version" "$(echo "$RSA_PRIVATE_KEY" | awk '1' ORS='\\n')"
        printf 'RSA_PUBLIC_KEY_%s="%s"\n' "$version" "$(echo "$RSA_PUBLIC_KEY" | awk '1' ORS='\\n')"
        echo "AES_SYMMETRIC_KEY_${version}=${AES_SYMMETRIC_KEY}"
    } >> "$ENV_FILE"
done

echo "Successfully created $ENV_FILE"