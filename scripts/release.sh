#!/bin/bash

# Release script for CoupleTasks
# Prompts for version bump type, updates version, commits, tags, and pushes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository!"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit or stash them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Parse version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

# Prompt for version bump type
echo ""
echo "Select version bump type:"
echo "1) Patch (x.x.X) - Bug fixes and minor changes"
echo "2) Minor (x.X.x) - New features, backwards compatible"
echo "3) Major (X.x.x) - Breaking changes"
echo ""
read -p "Enter choice [1-3]: " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        PATCH=$((PATCH + 1))
        VERSION_TYPE="patch"
        ;;
    2)
        MINOR=$((MINOR + 1))
        PATCH=0
        VERSION_TYPE="minor"
        ;;
    3)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        VERSION_TYPE="major"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
print_info "New version: $NEW_VERSION"

# Confirm before proceeding
echo ""
read -p "Create release v$NEW_VERSION? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Release cancelled."
    exit 0
fi

# Update version in package.json
print_info "Updating package.json..."
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update version in app.json
print_info "Updating app.json..."
node -e "
const fs = require('fs');
const appConfig = require('./app.json');
appConfig.expo.version = '$NEW_VERSION';
fs.writeFileSync('./app.json', JSON.stringify(appConfig, null, 2) + '\n');
"

# Get recent commits for release notes (last 10 commits)
print_info "Generating release notes from recent commits..."
RELEASE_NOTES=$(git log --pretty=format:"- %s (%h)" -10)
RELEASE_NOTES="## Changes in v$NEW_VERSION

$RELEASE_NOTES

---
*Full changelog: https://github.com/Frostswing/CoupleTasks/compare/v$CURRENT_VERSION...v$NEW_VERSION*"

# Commit changes
print_info "Committing version changes..."
git add package.json app.json
git commit -m "chore: bump version to $NEW_VERSION" || {
    print_error "Failed to commit changes. Make sure you have changes to commit."
    exit 1
}

# Create git tag
TAG_NAME="v$NEW_VERSION"
print_info "Creating tag: $TAG_NAME"
git tag -a "$TAG_NAME" -m "Release v$NEW_VERSION

$RELEASE_NOTES" || {
    print_error "Failed to create tag. Tag might already exist."
    exit 1
}

# Push commits and tags
print_info "Pushing to GitHub..."
git push origin main || git push origin master || {
    print_error "Failed to push. Please check your branch name and remote configuration."
    exit 1
}

git push origin "$TAG_NAME" || {
    print_error "Failed to push tag."
    exit 1
}

print_info "Release v$NEW_VERSION created successfully!"
print_info "GitHub Actions will now build the APK and create a release."
echo ""
echo "Release notes:"
echo "$RELEASE_NOTES"
echo ""

