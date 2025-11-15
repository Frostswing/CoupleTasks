# Notifications Setup Guide

## Overview

CoupleTasks uses **local scheduled notifications** to remind users about upcoming tasks. These notifications are scheduled locally on the device and don't require a server.

## Important: Expo Go Limitations

⚠️ **As of Expo SDK 53, push notifications are NOT supported in Expo Go on Android/iOS.**

- **Local scheduled notifications** (what this app uses) *should* work in Expo Go, but may have limitations
- For **reliable notification support**, you need to create a **development build** or **standalone app**

## Current Implementation

The app uses `expo-notifications` for:
- Scheduling local notifications for tasks with due dates and times
- Configurable notification offset (default: 6 hours before task)
- Automatic notification scheduling when tasks are created/updated
- Notification cancellation when tasks are completed

## Setup for Development Build

To enable full notification support, create a development build:

### Prerequisites

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

### Create Development Build

#### For Android:
```bash
eas build --profile development --platform android
```

#### For iOS (requires Apple Developer account):
```bash
eas build --profile development --platform ios
```

### Install Development Build

After the build completes:
1. Download the APK/IPA from the EAS dashboard
2. Install it on your device
3. Run `expo start --dev-client` to connect to the development build

### Testing Notifications

Once you have a development build:
1. Create a task with a due date and time
2. Set notification offset (default: 6 hours before)
3. Wait for the notification to trigger
4. Verify notification appears at the scheduled time

## Configuration

Notifications are configured in `app.json`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#8B5CF6",
        "sounds": []
      }
    ]
  ]
}
```

## Notification Service

The notification service (`src/services/notificationService.js`) handles:
- Permission requests
- Scheduling notifications
- Canceling notifications
- Updating notifications when tasks change

## Troubleshooting

### Notifications not working in Expo Go?

This is expected. Expo Go has limited notification support. Create a development build for full functionality.

### Notifications not appearing in development build?

1. Check that notification permissions are granted
2. Verify the task has both `due_date` and `due_time` set
3. Check that notification time is in the future
4. Review console logs for errors

### Permission denied?

The app will request notification permissions on first launch. If denied:
- iOS: Go to Settings > CoupleTasks > Notifications
- Android: Go to Settings > Apps > CoupleTasks > Notifications

## Future Enhancements

- Push notifications via Firebase Cloud Messaging (requires server setup)
- Notification categories and actions
- Custom notification sounds
- Notification history

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/development/introduction/)

