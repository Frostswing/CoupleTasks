# CoupleTasks

Meant for all the couples out there fighting for doing chores

A React Native mobile application built with Expo to help couples manage household tasks, shopping lists, and inventory together in real-time.

## Features

- 📋 Task management with categories and scheduling
- 🛒 Shared shopping lists
- 📦 Inventory tracking
- 🔔 Notifications and reminders
- 👥 Real-time synchronization between partners
- 🌐 Multi-language support (English, Hebrew)
- 📊 History and statistics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npm start
```

### Running the App

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web (limited support)
```

## Creating a New Release

The project uses automated CI/CD for building and releasing Android APKs via GitHub Actions and EAS Build.

### Quick Release Steps

1. **Run the release script:**
   ```bash
   ./scripts/release.sh
   ```

2. **Select version bump type:**
   - `1` - **Patch** (x.x.X): Bug fixes and minor changes
   - `2` - **Minor** (x.X.x): New features, backwards compatible
   - `3` - **Major** (X.x.x): Breaking changes

3. **Confirm the release** when prompted

4. **The script automatically:**
   - Updates version in `package.json` and `app.json`
   - Generates release notes from recent commits
   - Commits the version changes
   - Creates a git tag (e.g., `v1.0.1`)
   - Pushes commits and tag to GitHub

5. **GitHub Actions automatically:**
   - Builds Android APK using EAS Build
   - Creates a GitHub Release with the APK attached
   - Includes auto-generated release notes

### Monitoring the Build

- Go to the **Actions** tab in your GitHub repository
- Watch the "Build and Release" workflow progress
- Once complete, the release will appear in the **Releases** section

### Prerequisites for Releases

Before creating your first release, ensure:

1. **Expo Token** is set in GitHub Secrets:
   - Repository → Settings → Secrets and variables → Actions
   - Add `EXPO_TOKEN` with your Expo access token
   - Get token from: https://expo.dev/accounts/[your-account]/settings/access-tokens

2. **EAS CLI** is installed and configured:
   ```bash
   npm install -g eas-cli
   eas login
   ```

For detailed setup instructions, see [documentation/RELEASE_SETUP.md](./documentation/RELEASE_SETUP.md).

## Project Structure

```
CoupleTasks/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── screens/           # Screen components
│   ├── services/          # Business logic services
│   ├── navigation/        # Navigation configuration
│   └── firebase/          # Firebase configuration
├── assets/                # Images and icons
├── scripts/               # Utility scripts
│   └── release.sh         # Release script
├── documentation/        # Documentation files
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Documentation

- [Architecture](./documentation/ARCHITECTURE.md) - System architecture and technical details
- [Release Setup](./documentation/RELEASE_SETUP.md) - Detailed release setup guide
- [Firebase Security Rules](./documentation/FIREBASE_SECURITY_RULES.md) - Database security configuration
- [Notifications](./documentation/NOTIFICATIONS.md) - Notification system documentation

## Technology Stack

- **Framework:** React Native (Expo)
- **Backend:** Firebase (Realtime Database, Auth, Storage)
- **Build:** EAS Build
- **CI/CD:** GitHub Actions

## License

Private project
