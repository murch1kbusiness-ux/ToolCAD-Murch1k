#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_SRC="$PREP_ROOT/app-source"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (v20+ recommended)."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required."
  exit 1
fi

cd "$APP_SRC"

echo "[1/3] Installing dependencies via npm ci"
npm ci

echo "[2/3] Building application"
npm run build

echo "[3/3] Packaging unsigned macOS build (.app/.dmg)"
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac

echo "Build finished. Expected outputs:"
echo "- app bundle: $APP_SRC/release/mac-universal/ToolCAD.app"
echo "- dmg image:  $APP_SRC/release/ToolCAD-*.dmg"