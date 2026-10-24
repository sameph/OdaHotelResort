#!/bin/bash
# =============================================================================
# Oda Hotel Resort — cPanel Deployment Script
# =============================================================================
# This script:
#   1. Builds the project for production
#   2. Assembles only the files needed for cPanel into a deploy/ directory
#   3. Creates oda-deploy.zip for upload via cPanel File Manager
#
# Usage:
#   chmod +x deploy-cpanel.sh
#   ./deploy-cpanel.sh
# =============================================================================

set -e

DEPLOY_DIR="deploy"
ZIP_NAME="oda-deploy.zip"

echo "🏨 Oda Hotel Resort — cPanel Deployment"
echo "========================================"

# ── Step 1: Build ──────────────────────────────────────────────────────────
echo ""
echo "📦 Step 1: Building for production..."
npm run build

if [ ! -d ".output" ]; then
  echo "❌ Build failed — .output/ directory not found."
  exit 1
fi
echo "✅ Build complete."

# ── Step 2: Assemble deploy directory ──────────────────────────────────────
echo ""
echo "📁 Step 2: Assembling deployment files..."

# Clean previous deploy
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy the Nitro server output (server + public assets)
cp -r .output "$DEPLOY_DIR/.output"

# Copy package.json (needed for npm install on server)
cp package.json "$DEPLOY_DIR/package.json"

# Copy .env if it exists (user can also set env vars via cPanel UI)
if [ -f ".env" ]; then
  cp .env "$DEPLOY_DIR/.env"
  echo "   ℹ️  Included .env — you can also set these via cPanel Node.js App env vars"
fi

# Copy .htaccess for Passenger
if [ -f ".htaccess" ]; then
  cp .htaccess "$DEPLOY_DIR/.htaccess"
fi

# Create a minimal package.json for production dependencies only
# The server output is self-contained, but we include package.json
# in case any runtime dependencies need npm install
cat > "$DEPLOY_DIR/startup.js" << 'EOF'
// cPanel Passenger startup file
// This file is the entry point that Passenger uses to start the app.
// It simply loads the Nitro server output.

const { createServer } = require("http");
const { readFileSync } = require("fs");
const { join } = require("path");

// Passenger sets the port via the 'PORT' environment variable
const port = process.env.PORT || 3000;

// Dynamic import of the ESM server entry
async function start() {
  const server = await import(join(__dirname, ".output", "server", "index.mjs"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
EOF

echo "✅ Deployment files assembled in ./$DEPLOY_DIR/"

# ── Step 3: Create zip ────────────────────────────────────────────────────
echo ""
echo "📦 Step 3: Creating $ZIP_NAME..."

rm -f "$ZIP_NAME"
cd "$DEPLOY_DIR"
zip -r "../$ZIP_NAME" . -x "*/node_modules/*" > /dev/null 2>&1
cd ..

ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
echo "✅ Created $ZIP_NAME ($ZIP_SIZE)"

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "🚀 Deployment package ready!"
echo ""
echo "Next steps:"
echo "  1. Log into cPanel"
echo "  2. Go to File Manager → navigate to your app directory (e.g. ~/odaresort/)"
echo "  3. Upload $ZIP_NAME and extract it"
echo "  4. Go to 'Setup Node.js App' → Create Application"
echo "     - Node.js version: 18+ (20 or 22 recommended)"  
echo "     - Application mode: Production"
echo "     - Application root: odaresort"
echo "     - Application startup file: .output/server/index.mjs"
echo "  5. Add environment variables (see .env for values)"
echo "  6. Click 'Run NPM Install' then 'Start App'"
echo "========================================"

