#!/bin/bash

# Production build script for Primus Client
echo "Building Primus Client for production..."

# Set production environment
export VITE_API_BASE_URL=https://primusadmin.in

# Install dependencies if needed
npm install

# Build the application
npm run build

echo "Build complete! Files are in the 'dist' directory."
echo "Deploy the contents of 'dist' to your web server at primustech.in"
