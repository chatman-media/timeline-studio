#!/bin/bash

# Script to fix remaining BaseAITool issues

# Find all TypeScript files in ai-tools/tools directory
files=$(find src/domains/ai-tools/tools -name "*.ts" -not -path "*/node_modules/*" -not -path "*/__tests__/*")

for file in $files; do
  if [ -f "$file" ]; then
    # Fix: Replace this.toolName with this.metadata.name
    sed -i '' 's/this\.toolName/this.metadata.name/g' "$file"

    # Note: We need to manually add executionId to error returns, which is more complex
    echo "Fixed toolName references in: $file"
  fi
done

echo "Phase 1 complete - toolName references fixed!"
echo "Note: executionId must be added manually to error results"
