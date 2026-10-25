#!/usr/bin/env bash
# Git Modifier - /rewrite launcher
# Usage:
#   /rewrite [path_to_repo] [revision]
# Examples:
#   /rewrite
#   /rewrite . HEAD
#   /rewrite ~/my-project main

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$PWD}"
TARGET_REV="${2:-HEAD}"

# Resolve absolute path for target directory
if [ -d "$TARGET_DIR" ]; then
    TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Git Repo Modifier — Launching /rewrite"
echo "  Target Repo: $TARGET_DIR"
echo "  Revision:    $TARGET_REV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Select Python environment (.venv if present, otherwise system python3)
if [ -f "$SCRIPT_DIR/.venv/bin/python" ]; then
    PYTHON_EXEC="$SCRIPT_DIR/.venv/bin/python"
else
    PYTHON_EXEC="$(command -v python3 || command -v python)"
fi

# Check if Flask server is already running on 127.0.0.1:5000
SERVER_RUNNING=0
if curl -s http://127.0.0.1:5000/ >/dev/null 2>&1; then
    SERVER_RUNNING=1
    echo "  Server: Already running on http://127.0.0.1:5000"
else
    echo "  Server: Starting Flask background service..."
    cd "$SCRIPT_DIR"
    nohup "$PYTHON_EXEC" "$SCRIPT_DIR/main.py" >/dev/null 2>&1 &
    sleep 1.2
fi

# Open web interface in default browser
URL="http://127.0.0.1:5000"
echo "  Browser: Opening $URL ..."
if command -v open >/dev/null 2>&1; then
    open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
fi

echo "  Ready! Inspect and modify your repository in the browser."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
