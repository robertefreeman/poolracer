#!/bin/bash

# Simple deployment script for Cloudflare Workers
echo "Deploying NVSL Swimming Game to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Deploy to Cloudflare Workers
echo "Deploying to Cloudflare Workers..."
wrangler pages deploy . --project-name=nvsl-swimming-game

echo "Deployment complete!"
echo "Your game should be available at your Cloudflare Workers URL"