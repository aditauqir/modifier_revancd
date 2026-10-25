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
INPUT_DIR="${1:-$PWD}"
INPUT_REV="${2:-}"

# Check if target directory is inside a git repository
if git -C "$INPUT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    TARGET_DIR="$(git -C "$INPUT_DIR" rev-parse --show-toplevel)"
    if [ -n "$INPUT_REV" ]; then
        TARGET_REV="$INPUT_REV"
    else
        TARGET_REV="$(git -C "$INPUT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Git Repo Modifier — Launching /rewrite"
    echo "  ✓ Detected Git Repository: $TARGET_DIR"
    echo "  ✓ Active Branch / Rev:     $TARGET_REV"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    TARGET_DIR="$SCRIPT_DIR"
    TARGET_REV="${INPUT_REV:-HEAD}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Git Repo Modifier — Launching /rewrite"
    echo "  ℹ Notice: Not inside a Git repo ($INPUT_DIR)"
    echo "  ✓ Falling back to default: $TARGET_DIR"
    echo "  ✓ Revision:                $TARGET_REV"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

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

# Encode URL parameters so browser immediately loads this repository
ENCODED_ADDR="$(python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))' "$TARGET_DIR")"
ENCODED_REV="$(python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))' "$TARGET_REV")"
URL="http://127.0.0.1:5000/?addr=${ENCODED_ADDR}&rev=${ENCODED_REV}"

echo "  Browser: Opening $URL ..."
if command -v open >/dev/null 2>&1; then
    open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
fi

echo "  Ready! Inspect and modify your repository in the browser."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
