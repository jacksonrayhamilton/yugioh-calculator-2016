#!/usr/bin/env bash

ssh_login=ubuntu@ec2-54-67-17-42.us-west-1.compute.amazonaws.com

source ~/.nvm/nvm.sh

# Build and copy client files.
nvm exec grunt build

# Package the application and extract it on the server.
tar --verbose --create --gzip \
    build/ config/ scripts/start.sh server.js .nvmrc package.json \
    | ssh ${ssh_login} \
          'mkdir -p ~/yc/ && tar --verbose --extract --gzip -C ~/yc/'

# Install and start the application.  Assume the keys are already available in
# `~/yc/certs/`.  Yuck, using `sudo` because letsencrypt will probably lock down
# the SSL keys.
ssh ${ssh_login} <<EOF
source ~/.nvm/nvm.sh
cd ~/yc/
nvm exec npm install --production
sudo \$(which node) \$(which forever) start server.js
EOF
