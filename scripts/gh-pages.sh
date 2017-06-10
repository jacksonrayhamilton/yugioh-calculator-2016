#!/usr/bin/env bash

# Deploy the website via GitHub Pages, to test HTTPS-only features (like service
# workers).

# Normalize execution location.
FILE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$FILE_DIR/../"

# LOCAL_BUILD_DIR must end with a "/".
LOCAL_BUILD_DIR=public/

# It's easier to deploy to GitHub Pages in a separate directory.
DEPLOYMENT_DIR="$FILE_DIR/../../yugioh-calculator-2016-gh-pages/"

# Build production site to build directory.
YC_ENV='gh-pages' npm run build

# Copy local production build files to remote.
rsync --verbose --archive --update --delete \
      --exclude=.git \
      "$LOCAL_BUILD_DIR" \
      "$DEPLOYMENT_DIR"

cd "$DEPLOYMENT_DIR"
git add -A
git commit -m 'Automatically-generated commit.'
git push -f origin gh-pages
