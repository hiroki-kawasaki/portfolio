#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

readonly APP_GROUP_NAME='portfolio'
readonly APP_NAME='id'
readonly APP_STAGE="${1:-dev}"

if [ "$APP_STAGE" != 'dev' ] && [ "$APP_STAGE" != 'stg' ] && [ "$APP_STAGE" != 'prd' ]; then
    echo "Error: The first argument must be one of 'dev', 'stg' or 'prd'." >&2
    exit 1
fi

aws_command=("aws")
if [ "$APP_STAGE" != 'dev' ]; then
    aws_command+=("--profile" "$APP_STAGE")
fi

echo "Application Stage: $APP_STAGE"

if [ "$APP_STAGE" = 'prd' ]; then
    read -p 'You are about to deploy to the production environment. Are you sure? (y/N): ' answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
        echo 'Deployment aborted.'
        exit 0
    fi
fi

readonly GOOGLE_SECRET_NAME='/portfolio/google/secret'
readonly WEB_DOMAIN_NAME='/portfolio-web/domain'

echo "Running sam build..."
sam build > /dev/null 2>&1

echo "Validating SAM template..."
validateMsg=$(sam validate)
successMsg="$(pwd)/template.yaml is a valid SAM Template"

if [ "$validateMsg" != "$successMsg" ]; then
    echo "$validateMsg"
    exit 1
fi
echo "Template is valid."


echo "Fetching parameters from SSM Parameter Store..."
GOOGLE_SECRET=$("${aws_command[@]}" ssm get-parameter --name "$GOOGLE_SECRET_NAME" --with-decryption | jq -r '.Parameter.Value')
WEB_DOMAIN=$("${aws_command[@]}" ssm get-parameter --name "$WEB_DOMAIN_NAME" | jq -r '.Parameter.Value')

IFS=',' read -ra domains <<< "$WEB_DOMAIN"

web_client_urls=()
cognito_callback_urls=()

for domain in "${domains[@]}"; do
    if [ -n "$domain" ]; then
        web_client_urls+=("https://$domain")
        cognito_callback_urls+=("https://$domain/login/callback")
    fi
done

WebClientURLs=$(IFS=,; echo "${web_client_urls[*]}")
CognitoCallbackURLs=$(IFS=,; echo "${cognito_callback_urls[*]}")


echo "Deploying with sam deploy for environment: $APP_STAGE"
sam deploy \
    --stack-name "$APP_GROUP_NAME-$APP_NAME" \
    --s3-bucket "$APP_GROUP_NAME-stock-$APP_STAGE" \
    --s3-prefix "$APP_GROUP_NAME-$APP_NAME" \
    --tags "application-group-name=$APP_GROUP_NAME application-name=$APP_NAME application-stage=$APP_STAGE" \
    --parameter-overrides \
        GoogleClientSecret="$GOOGLE_SECRET" \
        WebClientURLs="$WebClientURLs" \
        CognitoCallbackURLs="$CognitoCallbackURLs"