#!/bin/bash

# Check Node.js version
REQUIRED_NODE_VERSION=23
CURRENT_NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')

if (( CURRENT_NODE_VERSION < REQUIRED_NODE_VERSION )); then
    echo "Error: Node.js version must be $REQUIRED_NODE_VERSION or higher. Current version is $CURRENT_NODE_VERSION."
    exit 1
fi

# Navigate to the script's directory
cd "$(dirname "$0")"/..

# Set the character to D3g3n_eral
export DEFAULT_CHARACTER="D3g3n_eral"

# Make sure the character file exists
if [ ! -f "characters/${DEFAULT_CHARACTER}.json" ]; then
    echo "Error: Character file characters/${DEFAULT_CHARACTER}.json not found."
    exit 1
fi

# Copy the character file to the expected location with .character.json extension
cp "characters/${DEFAULT_CHARACTER}.json" "characters/${DEFAULT_CHARACTER}.character.json"

# Run the smoke tests with D3g3n_eral
echo "Running smoke tests with ${DEFAULT_CHARACTER}..."
bash ./scripts/smokeTests.sh

# Clean up
rm "characters/${DEFAULT_CHARACTER}.character.json" 