#!/bin/bash

# Get current timestamp for commit message
timestamp=$(date "+%Y-%m-%d %H:%M:%S")

# Add all changes
git add .

# Commit with timestamp
git commit -m "Auto-commit: $timestamp"

# Push to GitHub
git push

# Deploy to Firebase
firebase deploy

echo "✅ Changes pushed to GitHub and deployed to Firebase successfully!" 