#!/bin/bash

# Script to build a production APK locally using Gradle
# This builds the APK on your local machine without using EAS Build

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

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "android" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java JDK 17 or higher."
    exit 1
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    print_warning "ANDROID_HOME or ANDROID_SDK_ROOT not set."
    print_info "Attempting to find Android SDK..."
    
    # Common Android SDK locations
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
        print_info "Found Android SDK at: $ANDROID_HOME"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
        print_info "Found Android SDK at: $ANDROID_HOME"
    else
        print_error "Android SDK not found. Please set ANDROID_HOME environment variable."
        exit 1
    fi
fi

# Check for production keystore
KEYSTORE_PATH="android/app/release.keystore"
KEYSTORE_PROPERTIES="android/keystore.properties"

if [ ! -f "$KEYSTORE_PATH" ]; then
    print_warning "Production keystore not found at: $KEYSTORE_PATH"
    echo ""
    echo "You need a production keystore to sign the APK."
    echo "Options:"
    echo "1) Create a new keystore (recommended for first time)"
    echo "2) Use existing keystore"
    echo "3) Build unsigned APK (for testing only)"
    echo ""
    read -p "Enter choice [1-3]: " KEYSTORE_CHOICE
    
    case $KEYSTORE_CHOICE in
        1)
            print_step "Creating new production keystore..."
            read -p "Enter keystore password: " -s KEYSTORE_PASSWORD
            echo
            read -p "Enter key alias (default: release-key): " KEY_ALIAS
            KEY_ALIAS=${KEY_ALIAS:-release-key}
            read -p "Enter key password: " -s KEY_PASSWORD
            echo
            read -p "Enter your name (for certificate): " NAME
            read -p "Enter organization unit: " OU
            read -p "Enter organization: " O
            read -p "Enter city: " CITY
            read -p "Enter state: " STATE
            read -p "Enter country code (2 letters, e.g., US): " COUNTRY
            
            keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE_PATH" \
                -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
                -storepass "$KEYSTORE_PASSWORD" -keypass "$KEY_PASSWORD" \
                -dname "CN=$NAME, OU=$OU, O=$O, L=$CITY, ST=$STATE, C=$COUNTRY"
            
            # Create keystore.properties file
            cat > "$KEYSTORE_PROPERTIES" << EOF
storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=app/release.keystore
EOF
            print_info "Keystore created successfully!"
            print_warning "IMPORTANT: Keep your keystore file and passwords safe!"
            print_warning "You'll need them for future updates to your app."
            ;;
        2)
            read -p "Enter path to your existing keystore: " EXISTING_KEYSTORE
            if [ ! -f "$EXISTING_KEYSTORE" ]; then
                print_error "Keystore file not found: $EXISTING_KEYSTORE"
                exit 1
            fi
            cp "$EXISTING_KEYSTORE" "$KEYSTORE_PATH"
            print_info "Keystore copied to: $KEYSTORE_PATH"
            
            if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
                print_info "Creating keystore.properties file..."
                read -p "Enter keystore password: " -s KEYSTORE_PASSWORD
                echo
                read -p "Enter key alias: " KEY_ALIAS
                read -p "Enter key password: " -s KEY_PASSWORD
                echo
                
                cat > "$KEYSTORE_PROPERTIES" << EOF
storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=app/release.keystore
EOF
            fi
            ;;
        3)
            print_warning "Building unsigned APK (not suitable for production release)"
            UNSIGNED_BUILD=true
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
fi

# Update build.gradle if keystore.properties exists and not unsigned build
if [ "$UNSIGNED_BUILD" != "true" ] && [ -f "$KEYSTORE_PROPERTIES" ]; then
    print_step "Configuring signing in build.gradle..."
    
    # Check if signing config already exists
    if ! grep -q "signingConfigs.release" android/app/build.gradle; then
        print_info "Adding release signing configuration..."
        # This will be done by modifying build.gradle
        # For now, we'll use a gradle.properties approach
    fi
    
    # Load keystore properties
    if [ -f "$KEYSTORE_PROPERTIES" ]; then
        source <(grep -v '^#' "$KEYSTORE_PROPERTIES" | sed 's/^/export /')
    fi
fi

# Clean previous builds
print_step "Cleaning previous builds..."
cd android
./gradlew clean

# Build the release APK
print_step "Building release APK..."
if [ "$UNSIGNED_BUILD" = "true" ]; then
    ./gradlew assembleRelease
else
    ./gradlew assembleRelease
fi

cd ..

# Find the generated APK
APK_PATH=$(find android/app/build/outputs/apk/release -name "*.apk" -type f | head -n 1)

if [ -z "$APK_PATH" ]; then
    print_error "APK not found. Build may have failed."
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
OUTPUT_FILE="CoupleTasks-v${VERSION}-production.apk"

# Copy APK to project root with version name
cp "$APK_PATH" "$OUTPUT_FILE"

print_info "Production APK built successfully!"
print_info "Location: $OUTPUT_FILE"
print_info "Original location: $APK_PATH"

# Get file size
if command -v ls &> /dev/null; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    print_info "File size: $FILE_SIZE"
fi

echo ""
print_info "You can now install this APK on Android devices"
if [ "$UNSIGNED_BUILD" = "true" ]; then
    print_warning "Note: This is an unsigned APK. For production, you need a signed APK."
fi

