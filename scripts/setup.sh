#!/usr/bin/env bash

ssh_login=ubuntu@ec2-54-67-17-42.us-west-1.compute.amazonaws.com

ssh ${ssh_login} <<EOF
# Download and install node via nvm.
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.1/install.sh | bash
source ~/.nvm/nvm.sh
NVM_SYMLINK_CURRENT=true nvm install 6
nvm alias default 6

# Most node applications will run under forever.
nvm exec npm install -g forever

# Allow node applications to run on ports 80 and 443.  Note that this must be
# re-run if node is later updated.
sudo setcap cap_net_bind_service=+eip ~/.nvm/current/bin/node
EOF
