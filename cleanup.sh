#!/bin/bash

# Farm Data Informer - System Cleanup Script
# Removes temporary files and organizes the project structure

echo "🧹 Starting Farm Data Informer cleanup..."

# Remove any remaining temporary test files
echo "Removing temporary test files..."
find . -name "test-*.cjs" -not -path "./tests/*" -delete 2>/dev/null || true
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

# Remove duplicate or outdated documentation
echo "Cleaning up documentation..."
rm -f "# Code Citations.md" 2>/dev/null || true
rm -f sonnet4_res.md 2>/dev/null || false
rm -f DATABASE_SETUP_REQUIRED.md 2>/dev/null || false

# Ensure proper directory structure
echo "Ensuring directory structure..."
mkdir -p docs/testing tests

# Move any remaining docs to proper location
find . -maxdepth 1 -name "ISSUE_*.md" -exec mv {} docs/ \; 2>/dev/null || true
find . -maxdepth 1 -name "*_STATUS.md" -not -name "PROJECT_STATUS.md" -exec mv {} docs/ \; 2>/dev/null || true

# Clean up node_modules if requested
if [ "$1" = "--deep" ]; then
    echo "Performing deep cleanup..."
    rm -rf node_modules
    rm -f package-lock.json
    echo "Run 'npm install' to restore dependencies"
fi
