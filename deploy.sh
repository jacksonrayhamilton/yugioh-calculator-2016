#!/bin/bash

# Exit on error.
set -e

# Build and push to divshot.
grunt build
cp -r build/* ../yc3-build/
cd ../yc3-build/
divshot push
