#!/usr/bin/env bash

# Deploy the website via SSH.

# Normalize execution location.
FILE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$FILE_DIR/../"

# Set SSH environment variables; should export the following:
# - SSH_USER
# - SSH_HOSTNAME
# - REMOTE_PROD_DEST_DIR
source .env

# LOCAL_BUILD_DIR must end with a "/".
LOCAL_BUILD_DIR=public/

# Build production site to build directory.
npm run build

# Copy local production build directory to remote.  Consider removing
# `--rsync-path 'sudo rsync'` if the directory doesn't require `sudo` and your
# user isn't a sudoer.
rsync --verbose --archive --update --delete \
      --rsync-path 'sudo rsync' \
      "$LOCAL_BUILD_DIR" \
      "$SSH_USER"@"$SSH_HOSTNAME":"$REMOTE_PROD_DEST_DIR"
