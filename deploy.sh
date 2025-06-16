#!/bin/bash

# Deployment script for Cloudflare Pages with Workers
echo "🏊‍♂️ Deploying NVSL Swimming Game to Cloudflare Pages..."

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

# Deploy to Cloudflare Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy . --project-name=nvsl-swimming-game --compatibility-date=2024-01-01

echo "✅ Deployment complete!"
echo "🌐 Your game will be available at: https://nvsl-swimming-game.pages.dev"
echo "📊 Check deployment status at: https://dash.cloudflare.com/pages"