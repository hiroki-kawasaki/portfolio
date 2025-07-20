#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

readonly APP_GROUP_NAME='portfolio'
readonly APP_NAME='base'
readonly APP_STAGE="${1:-dev}"

if [ "$APP_STAGE" != 'dev' ] && [ "$APP_STAGE" != 'stg' ] && [ "$APP_STAGE" != 'prd' ]; then
    echo "Error: The first argument must be one of 'dev', 'stg' or 'prd'." >&2
    exit 1
fi

echo "Application Stage: $APP_STAGE"

if [ "$APP_STAGE" = 'prd' ]; then
    read -p 'You are about to deploy to the production environment. Are you sure? (y/N): ' answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
        echo 'Deployment aborted.'
        exit 0
    fi
fi

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

echo "Deploying with sam deploy for environment: $APP_STAGE"
sam deploy \
    --stack-name "$APP_GROUP_NAME-$APP_NAME" \
    --s3-bucket "$APP_GROUP_NAME-stock-$APP_STAGE" \
    --s3-prefix "$APP_GROUP_NAME-$APP_NAME" \
    --tags "application-group-name=$APP_GROUP_NAME application-name=$APP_NAME application-stage=$APP_STAGE"