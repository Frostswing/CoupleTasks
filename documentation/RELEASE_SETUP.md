# Release Setup Guide

This guide explains how to set up and use the automated release process for CoupleTasks.

## Prerequisites

1. **Expo Account**: You need an Expo account (sign up at https://expo.dev)
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **EAS Login**: Run `eas login` to authenticate
4. **GitHub Repository**: Your repository should be connected to GitHub

## Initial Setup

### 1. Get Your Expo Access Token

1. Go to https://expo.dev/accounts/[your-account]/settings/access-tokens
2. Create a new token with appropriate permissions
3. Copy the token (you'll need it for GitHub Secrets)

### 2. Configure GitHub Secrets

1. Go to your GitHub repository: https://github.com/Frostswing/CoupleTasks
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `EXPO_TOKEN`
   - **Value**: Your Expo access token from step 1

Note: `GITHUB_TOKEN` is automatically provided by GitHub Actions, no need to add it manually.

### 3. Verify EAS Configuration

The `eas.json` file is already configured with three build profiles:
- **development**: For development builds
- **preview**: For preview/testing builds
- **production**: For release builds (used by CI/CD)

## Creating a Release

### Step 1: Run the Release Script

```bash
./scripts/release.sh
```

### Step 2: Select Version Bump Type

The script will prompt you to choose:
- **1** - Patch (x.x.X): For bug fixes and minor changes
- **2** - Minor (x.X.x): For new features that are backwards compatible
- **3** - Major (X.x.x): For breaking changes

### Step 3: Confirm Release

The script will show you the new version and ask for confirmation before proceeding.

### Step 4: Automated Process

Once confirmed, the script will:
1. Update `package.json` version
2. Update `app.json` version
3. Generate release notes from recent commits
4. Commit the version changes
5. Create a git tag (e.g., `v1.0.1`)
6. Push commits and tag to GitHub

### Step 5: GitHub Actions Build

After pushing the tag, GitHub Actions will automatically:
1. Trigger the build workflow
2. Build Android APK using EAS Build
3. Download the APK artifact
4. Create a GitHub Release with:
   - Release title (e.g., "Release v1.0.1")
   - Auto-generated release notes
   - APK file attached

## Monitoring the Build

1. Go to your GitHub repository
2. Click on **Actions** tab
3. You'll see the "Build and Release" workflow running
4. Click on it to see build progress and logs

## Troubleshooting

### Build Fails

- Check GitHub Actions logs for error messages
- Verify `EXPO_TOKEN` secret is correctly set
- Ensure EAS CLI is properly configured (`eas login`)
- Check that your Expo account has build credits/quota

### Script Fails to Push

- Ensure you have write access to the repository
- Check that your git remote is correctly configured
- Verify you're on the correct branch (main or master)

### APK Not Attached to Release

- Check GitHub Actions logs for download errors
- Verify EAS build completed successfully
- Ensure the build profile is set to "production" in `eas.json`

## Manual Build (Alternative)

If you need to build manually without creating a release:

```bash
# Build APK locally
eas build --platform android --profile production

# Or build and submit
eas build --platform android --profile production --auto-submit
```

## Release Notes

Release notes are automatically generated from git commits. The script includes:
- Last 10 commits in the release notes
- Commit messages formatted as bullet points
- Links to full changelog on GitHub

You can customize the release notes format by editing `scripts/release.sh`.

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)

