#!/bin/bash

# Function to increment version
increment_version() {
    # Extract current version from index.html (using the loading screen version as source of truth)
    current_version=$(grep -o 'class="version-number">v[0-9]\+\.[0-9]\+' public/index.html | grep -o '[0-9]\+\.[0-9]\+')
    
    if [ -z "$current_version" ]; then
        echo "Error: Could not find version number in index.html"
        exit 1
    fi
    
    # Split version into major and minor
    IFS='.' read -r major minor <<< "$current_version"
    
    # Increment minor version
    new_minor=$((minor + 1))
    new_version="v$major.$new_minor"
    
    # Update both version numbers in index.html
    sed -i '' "s/class=\"version-number\">v[0-9]\+\.[0-9]\+/class=\"version-number\">$new_version/" public/index.html
    sed -i '' "s/class=\"version-display\">v[0-9]\+\.[0-9]\+/class=\"version-display\">$new_version/" public/index.html
    
    echo "Version updated to $new_version"
}

# Get current timestamp for commit message
timestamp=$(date "+%Y-%m-%d %H:%M:%S")

# Increment version number
increment_version

# Add all changes
git add .

# Commit with timestamp and version
new_version=$(grep -o 'class="version-number">v[0-9]\+\.[0-9]\+' public/index.html | grep -o 'v[0-9]\+\.[0-9]\+')
git commit -m "Auto-commit: $timestamp (${new_version})"

# Push to GitHub
git push

# Deploy to Firebase
firebase deploy

echo "✅ Changes pushed to GitHub and deployed to Firebase successfully!" 