#!/usr/bin/env bash

ssh_login=ubuntu@ec2-54-67-17-42.us-west-1.compute.amazonaws.com

# Build and copy client files.
grunt build

# Cleanup old files.
ssh ${ssh_login} <<EOF
rm -rf ~/yc/
mkdir -p ~/yc/
EOF

# Package the application and extract it on the server.
tar --verbose --create --gzip build/ \
    | ssh ${ssh_login} \
          'tar --verbose --extract --gzip -C ~/yc/'
