# CoupleTasks Design System

See [ARCHITECTURE.md](./ARCHITECTURE.md) for overall system design.

## Principles

- Calm, professional, minimal UI (no cartoon styling, heavy gradients, or emoji-as-UI).
- One primary accent: blue (`#2563EB`).
- Consistent spacing, typography, and elevation via `src/constants/theme.js`.
- **Dark mode:** follows system appearance via `ThemeProvider` (`src/context/ThemeContext.js`) and React Navigation theme in `App.js`.
- RTL/Hebrew: unchanged; language selection and i18n flows remain.

## Auth persistence (native)

- `src/firebase/authBootstrap.native.js` uses `@firebase/auth` RN build + AsyncStorage.
- Web uses `authBootstrap.web.js` (`getAuth` only).

## Tokens

| Token | Location |
|-------|----------|
| Colors, spacing, radius, shadows, typography | `src/constants/theme.js` |
| Shared screen patterns | `src/components/common/screenStyles.js` |
| Category / priority / status colors | `CATEGORY_COLORS`, `PRIORITY_COLORS`, `STATUS_COLORS` in theme |

## Icons

- In-app: `@expo/vector-icons` / Material Icons (consistent set).
- Launcher: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`, `assets/favicon.png`.
- Regenerate from source: `npm run generate-icons` (source: `scripts/icon-source.png`).

## Firebase config

- Mobile: copy `src/firebase/config.example.js` → `src/firebase/config.js` or use `.env.example` variables.
- Web: `web-interface/src/firebase/config.example.js` → `config.js`.
