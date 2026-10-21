# Follow-up work (PR #2+)

Linked from [ARCHITECTURE.md](./ARCHITECTURE.md).

## Done in branch `cursor/modern-redesign-3d9a`

- UI redesign, icons, Firebase example config, web build fixes
- Shopping list store-aisle grouping + custom layout
- Native auth persistence (`authBootstrap.native.js`)
- Dark mode foundation (system scheme + navigation theme)
- Migrate in-app icons to `@expo/vector-icons` (removed `react-native-vector-icons`)
- Unit tests for store department helpers (`npm test`)

## Open — needs owner / credentials / devices

| Item | Why blocked |
|------|-------------|
| End-to-end device QA (Android/iOS) | Physical devices or store credentials |
| Production Firebase config | Real `EXPO_PUBLIC_FIREBASE_*` / `config.js` secrets |
| Google Sign-In | Standalone/dev build + OAuth client setup |
| EAS release validation | Expo account tokens, store listings |

## Open — product / larger engineering

| Priority | Item |
|----------|------|
| P1 | Expo SDK 58 upgrade (major; full regression + EAS) |
| P1 | Dark mode on all screens (tokens exist; many screens still use static StyleSheet colors) |
| P1 | Web interface shopping aisle parity (`web-interface/`) |
| P2 | Learn `store_department` from edit history |
| P2 | Jest/Detox integration tests in CI |
| P2 | Offline reads for shopping/inventory |
| P3 | AI task suggestions, widgets, push (dev build) |
