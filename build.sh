#!/bin/bash

echo "Building Primus Client for primustech.in..."

# Install dependencies
npm install

# Build the application
npm run build

echo "✅ Build complete!"
echo "📁 Files are in the 'dist' directory"
echo "🚀 Deploy the contents of 'dist' to your web server at primustech.in"
echo ""
echo "📋 Next steps:"
echo "1. Upload dist/* to your web server"
echo "2. Configure your web server for SPA routing"
echo "3. Test registration and login at primustech.in"
