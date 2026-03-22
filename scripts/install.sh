#!/bin/bash
set -e

# BluePrintMe installer
# Clones the repo and symlinks the CLI into PATH

# Ensure we're in a valid directory (handles deleted cwd)
cd "$HOME" 2>/dev/null || cd /tmp

INSTALL_DIR="$HOME/.claude-skills/BluePrintMe"
BIN_DIR="$HOME/.local/bin"
BIN_NAME="blueprintme"

echo "Installing BluePrintMe..."

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --ff-only
else
  echo "Cloning repository..."
  git clone https://github.com/tsikii/BluePrintMe.git "$INSTALL_DIR"
fi

# Create bin directory and symlink
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/$BIN_NAME" "$BIN_DIR/$BIN_NAME"
chmod +x "$INSTALL_DIR/bin/$BIN_NAME"

# Check if ~/.local/bin is in PATH
if ! echo "$PATH" | tr ':' '\n' | grep -q "$BIN_DIR"; then
  SHELL_NAME="$(basename "$SHELL")"
  case "$SHELL_NAME" in
    zsh)  RC_FILE="$HOME/.zshrc" ;;
    bash) RC_FILE="$HOME/.bashrc" ;;
    *)    RC_FILE="$HOME/.profile" ;;
  esac

  if ! grep -q "$BIN_DIR" "$RC_FILE" 2>/dev/null; then
    echo "" >> "$RC_FILE"
    echo "# BluePrintMe" >> "$RC_FILE"
    echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$RC_FILE"
    echo "Added $BIN_DIR to PATH in $RC_FILE"
    echo "Run: source $RC_FILE (or restart your terminal)"
  fi
fi

echo ""
echo "BluePrintMe CLI installed to $BIN_DIR/$BIN_NAME"
echo ""
echo "Next, in Claude Code run:"
echo "  /plugin marketplace add tsikii/BluePrintMe"
echo "  /plugin install blueprintme@BluePrintMe"
echo ""
echo "Then restart Claude Code."
