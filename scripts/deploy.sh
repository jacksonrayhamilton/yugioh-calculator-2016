#!/usr/bin/env bash

# Deploy the website via Vercel.
# Usage: ./deploy.sh [preview|prod]
# Default is preview if no argument is provided.

# Normalize execution location.
FILE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$FILE_DIR/../"

# LOCAL_BUILD_DIR must end with a "/".
LOCAL_BUILD_DIR=public/

# Get deployment environment from first argument
DEPLOY_ENV="${1:-preview}"

# Validate deployment environment
if [ "$DEPLOY_ENV" != "prod" -a "$DEPLOY_ENV" != "preview" ]
then
  echo "Error: Invalid deployment environment '$DEPLOY_ENV'"
  echo "Usage: ./deploy.sh [preview|prod]"
  exit 1
fi

# Build production site to build directory.
npm run build

# Upload to Vercel.
if [ "$DEPLOY_ENV" = "prod" ]
then
  echo "Deploying to production environment..."
  vercel --prod
else
  echo "Deploying to preview environment..."
  vercel
fi
