#!/usr/bin/env bash

ssh_login=ubuntu@ec2-54-67-17-42.us-west-1.compute.amazonaws.com

# Build and copy client files.
grunt build

# Package the application and extract it on the server.
tar --verbose --create --gzip build/ \
    | ssh ${ssh_login} \
          'mkdir -p ~/yc/ && tar --verbose --extract --gzip -C ~/yc/'
