#!/bin/bash
# Skillporter Unified Setup Script

set -e

REPO_DIR=$(pwd)
EXTENSION_DIR="$HOME/.openclaw/extensions/skillporter"
PLIST_NAME="com.skillporter.server.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "🚀 Setting up Skillporter Sidecar and OpenClaw Plugin..."

# 1. Install Sidecar Dependencies and Build
echo "📦 Building sidecar..."
npm install
npm run build

# 2. Make sidecar globally available
echo "🔗 Linking sidecar CLI..."
npm link --force

# 3. Setup LaunchAgent
echo "🛠️ Configuring background service (LaunchAgent)..."
if [ -f "$REPO_DIR/scripts/$PLIST_NAME" ]; then
    cp "$REPO_DIR/scripts/$PLIST_NAME" "$PLIST_PATH"
    # Update the WorkingDirectory in the plist to the current repo
    sed -i '' "s|/Users/clawdius/Projects/skillporter|$REPO_DIR|g" "$PLIST_PATH"
    
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"
    echo "✅ Sidecar service loaded and running on Port 3000."
else
    echo "⚠️ Warning: $PLIST_NAME not found in scripts/. Skipping service setup."
fi

# 4. Link OpenClaw Plugin
echo "🧩 Linking OpenClaw plugin..."
mkdir -p "$HOME/.openclaw/extensions"

# Remove existing folder/link if it exists
rm -rf "$EXTENSION_DIR"

# Create symlink from repo to OpenClaw extensions folder
ln -s "$REPO_DIR/plugins/openclaw" "$EXTENSION_DIR"

# Build the plugin
echo "🔨 Building plugin..."
cd "$REPO_DIR/plugins/openclaw"
npm install
npm run build

echo "✨ Setup Complete!"
echo "------------------------------------------------"
echo "1. Sidecar: Running in background (com.skillporter.server)"
echo "2. Plugin: Symlinked to $EXTENSION_DIR"
echo "3. Action: RESTART your OpenClaw Gateway to enable the plugin."
echo "------------------------------------------------"
