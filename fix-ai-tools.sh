#!/bin/bash

# Script to fix BaseAITool implementation issues across all AI tool files

# Find all TypeScript files in ai-tools/tools directory
files=$(find src/domains/ai-tools/tools -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*")

for file in $files; do
  if [ -f "$file" ]; then
    # Fix 1: Replace super("ToolName", logger) with super(undefined, logger)
    sed -i '' 's/super("\([^"]*\)", logger)/super(undefined, logger)/g' "$file"

    # Fix 2: Replace super("ToolName") with super(undefined)
    sed -i '' 's/super("\([^"]*\)")/super(undefined)/g' "$file"

    # Fix 3: Replace this.validateInput with this.validateInputDetailed
    sed -i '' 's/this\.validateInput(/this.validateInputDetailed(/g' "$file"

    echo "Fixed: $file"
  fi
done

echo "All files processed!"
