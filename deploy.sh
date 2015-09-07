#!/bin/bash

# Exit on error.
set -e

mkdir -p ../yc3-build/

# Build and push to divshot.
grunt build
cp -r build/* ../yc3-build/
cd ../yc3-build/
divshot push
