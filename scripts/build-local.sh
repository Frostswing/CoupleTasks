#!/bin/bash

# Local build script for testing APK builds before release
# This builds the APK locally using EAS Build without creating a release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed!"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

# Check if jq is installed (needed for JSON parsing)
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed!"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    echo "  Or download from: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Check if logged in to EAS
print_step "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_warning "Not logged in to EAS. Attempting to login..."
    eas login
fi

print_info "Logged in as: $(eas whoami)"

# Check if EAS project is configured
print_step "Checking EAS project configuration..."
if [ ! -f "eas.json" ]; then
    print_warning "eas.json not found. EAS project needs to be initialized."
    echo ""
    read -p "Run 'eas init' now? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        print_info "Initializing EAS project..."
        APP_SLUG=$(node -p "require('./app.json').expo.slug || 'coupletasks'")
        eas init --id "$APP_SLUG" || {
            print_error "Failed to initialize EAS project. Please run 'eas init' manually."
            exit 1
        }
        print_info "EAS project initialized successfully!"
    else
        print_error "EAS project must be initialized. Run 'eas init' first."
        exit 1
    fi
else
    # Check if project is properly linked (try a simple EAS command)
    if ! eas project:info &> /dev/null; then
        print_warning "EAS project exists but may not be properly linked."
        print_info "Attempting to link project..."
        APP_SLUG=$(node -p "require('./app.json').expo.slug || 'coupletasks'")
        eas init --id "$APP_SLUG" --force || {
            print_error "Failed to link EAS project. Please run 'eas init' manually."
            exit 1
        }
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Ask for build profile
echo ""
echo "Select build profile:"
echo "1) Preview - Internal testing APK"
echo "2) Production - Release-ready APK"
echo ""
read -p "Enter choice [1-2] (default: 1): " PROFILE_CHOICE

case $PROFILE_CHOICE in
    1)
        BUILD_PROFILE="preview"
        ;;
    2)
        BUILD_PROFILE="production"
        ;;
    "")
        BUILD_PROFILE="preview"
        ;;
    *)
        print_error "Invalid choice. Using preview profile."
        BUILD_PROFILE="preview"
        ;;
esac

print_info "Using build profile: $BUILD_PROFILE"

# Ask if they want to wait for build or run in background
echo ""
read -p "Wait for build to complete? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    WAIT_FLAG="--no-wait"
    print_info "Build will run in background. Check status with: eas build:list"
else
    WAIT_FLAG="--wait"
    print_info "Will wait for build to complete..."
fi

# Start the build
print_step "Starting EAS build..."
print_info "Platform: Android"
print_info "Profile: $BUILD_PROFILE"
echo ""

if [ "$WAIT_FLAG" = "--wait" ]; then
    print_step "Starting EAS build..."
    # Try build - if credentials are missing, EAS will show a clear error message
    if ! eas build --platform android --profile "$BUILD_PROFILE" --non-interactive --wait; then
        print_error ""
        print_error "Build failed!"
        print_warning "If you see 'keystore' or 'credentials' errors, you need to set up Android credentials first:"
        print_info "  Run: eas credentials --platform android"
        print_info "  Then run this script again."
        exit 1
    fi
    
    print_info "Build completed successfully!"
    echo ""
    print_step "Downloading APK..."
    
    # Get the most recent build
    BUILD_JSON=$(eas build:list --platform android --limit 1 --json)
    BUILD_ID=$(echo "$BUILD_JSON" | jq -r '.[0].id')
    DOWNLOAD_URL=$(echo "$BUILD_JSON" | jq -r '.[0].artifacts.buildUrl')
    
    if [ "$DOWNLOAD_URL" != "null" ] && [ -n "$DOWNLOAD_URL" ]; then
        OUTPUT_FILE="app-${BUILD_PROFILE}-${CURRENT_VERSION}.apk"
        print_info "Downloading to: $OUTPUT_FILE"
        
        # Try wget first, then curl
        if command -v wget &> /dev/null; then
            wget -O "$OUTPUT_FILE" "$DOWNLOAD_URL"
        elif command -v curl &> /dev/null; then
            curl -L -o "$OUTPUT_FILE" "$DOWNLOAD_URL"
        else
            print_error "Neither wget nor curl is available. Please download manually:"
            print_info "Download URL: $DOWNLOAD_URL"
            exit 1
        fi
        
        if [ -f "$OUTPUT_FILE" ]; then
            print_info "APK downloaded successfully: $OUTPUT_FILE"
            
            # Get file size
            if command -v ls &> /dev/null; then
                FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
                print_info "File size: $FILE_SIZE"
            fi
            
            print_info "You can now install and test this APK on an Android device"
        else
            print_error "Download failed"
            exit 1
        fi
    else
        print_error "Could not get download URL"
        print_info "Check build status with: eas build:list"
        exit 1
    fi
else
    print_step "Starting EAS build..."
    # Try build - if credentials are missing, EAS will show a clear error message
    if ! eas build --platform android --profile "$BUILD_PROFILE" --non-interactive --no-wait; then
        print_error ""
        print_error "Build failed!"
        print_warning "If you see 'keystore' or 'credentials' errors, you need to set up Android credentials first:"
        print_info "  Run: eas credentials --platform android"
        print_info "  Then run this script again."
        exit 1
    fi
    print_info "Build started in background!"
    print_info "Check status with: eas build:list"
    print_info "View build details: eas build:view [BUILD_ID]"
fi

echo ""
print_info "Build process completed!"

