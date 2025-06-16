#!/bin/bash

# Deployment script for Cloudflare Workers
echo "🏊‍♂️ Deploying NVSL Swimming Game to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Prepare dist directory
echo "📁 Preparing assets..."
mkdir -p dist
cp -r index.html src dist/

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your game will be available at: https://nvsl-swimming-game.your-subdomain.workers.dev"
echo "📊 Check deployment status at: https://dash.cloudflare.com/workers"