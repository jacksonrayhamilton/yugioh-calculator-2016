#!/usr/bin/env bash

# Configure this script to run with crontab -e with the following line:
#
#   @reboot /home/ubuntu/yc/scripts/start.sh

source ~/.nvm/nvm.sh
cd ~/yc/
sudo $(which node) $(which forever) start server.js
