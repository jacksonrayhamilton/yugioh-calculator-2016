#!/usr/bin/env bash

# From https://github.com/gruntjs/grunt-contrib-connect, generate a self-signed
# SSL certificate.

mkdir -p certs && cd certs

### Create ca.key, use a password phrase when asked
### When asked 'Common Name (e.g. server FQDN or YOUR name) []:' use your hostname, i.e 'mysite.dev'
openssl genrsa -des3 -out ca.key 1024
openssl req -new -key ca.key -out ca.csr
openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key

### Create server certificate
openssl genrsa -des3 -out server.key 1024
openssl req -new -key server.key -out server.csr

### Remove password from the certificate
cp server.key server.key.org
openssl rsa -in server.key.org -out server.key

### Generate self-siged certificate
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
