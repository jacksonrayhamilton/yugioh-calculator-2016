#!/usr/bin/env bash

# Deploy the website via SSH.

# Normalize execution location.
FILE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$FILE_DIR/../"

# Set SSH environment variables; should export the following:
# - SSH_USER
# - SSH_HOSTNAME
# - REMOTE_PROD_DEST_DIR
# - SERVER_RELOAD_COMMAND
source .env

# Generated cache manifest configuration.
MANIFEST_CONF=manifest.conf

# LOCAL_BUILD_DIR must end with a "/".
LOCAL_BUILD_DIR=public/

# Build production site to build directory.
npm run build

# Copy local production build files to remote.  Consider removing `--rsync-path
# 'sudo rsync'` if the directory doesn't require `sudo` and your user isn't a
# sudoer.
rsync --verbose --archive --update --delete \
      --rsync-path 'sudo rsync' \
      "$LOCAL_BUILD_DIR" \
      "$SSH_USER"@"$SSH_HOSTNAME":"$REMOTE_PROD_DEST_DIR/html/"
rsync --verbose --archive --update --delete \
      --rsync-path 'sudo rsync' \
      "$MANIFEST_CONF" \
      "$SSH_USER"@"$SSH_HOSTNAME":"$REMOTE_PROD_DEST_DIR/$MANIFEST_CONF"

# Reload the server in case dynamically-generated configuration changed.
ssh "$SSH_USER"@"$SSH_HOSTNAME" "$SERVER_RELOAD_COMMAND"
