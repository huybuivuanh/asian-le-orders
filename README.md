# Asian Le Orders

Admin app for the restaurant's **online orders** from the Asian Le website. Staff see new
orders arrive live (with a sound), accept them with a ready time, print them, collect or
use the customer's rewards points, and complete or cancel them. It also controls the
website's sold-out items, pausing online ordering, and the wait time.

Runs on **iOS, Android (tablet) and web** from one Expo codebase. The website writes the
orders; this app only manages them.

## Features

- **Live Orders:** new and in-progress orders, live from Firestore. A full-screen alert and
  sound for each new order. Accept with a ready-in time (defaults to the store's wait time),
  print, add an extra charge, complete, cancel. Card colours match the POS (new, scheduled,
  in progress, completed, cancelled)
- **Order History:** the last 100 orders, with search and filters; reprint from here, and fix
  rewards points that couldn't be collected or removed at the time
- **Menu:** mark website menu items and options sold out
- **Settings:** pause online ordering (with a reminder while paused), wait time
- **Asian Le Rewards:** on Complete, takes any points the customer used for a discount, then
  earns points on what they paid (rewards Cloud Functions; retries never double-count).
  Cancelling reverses them
- **Printing:** sends the order to `onlinePrintQueue`; the `print-server-orders` service on the
  restaurant PC prints it. A reprint sends the current order again
- **Tablet friendly:** keeps the screen awake, reloads after 5 minutes in the background, shows
  an offline overlay, and forces an update when `appConfig/ordersVersion` says the app is too old
- **Admin only:** accounts need custom claims `{ businessId, role: "admin" }`; staff are refused
- Crash reports via Sentry

## Tech stack

| Area | Tools |
|---|---|
| App | Expo SDK 58, React Native 0.88, Expo Router |
| Styling | NativeWind 4, same look as website-admin (dark ink header, gold accents) |
| Data | Firebase Auth + Firestore in the shared `asianlepos` project |
| Builds | EAS Build / Submit (`eas.json`) |
| Web | Firebase Hosting, site `asianle-orders` |

## Getting started

```bash
npm install            # postinstall applies patches/ (react-native fix)
cp .env.example .env   # fill in the asianlepos web app config (EXPO_PUBLIC_FIREBASE_*)
npm start              # then press w / a / i
```

Keep `.npmrc` (`legacy-peer-deps=true`); `npm install` and EAS builds fail without it.

| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm run web` / `android` / `ios` | Start on one platform |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check (there's no test suite) |

### Deploying

- **Native:** `eas build --profile production` then `eas submit` (build numbers are managed
  remotely by EAS).
- **Web:** `npx expo export --platform web`, then `firebase deploy --only hosting` (deploys
  `dist/` to the `asianle-orders` site in `asianlepos`).

## Data

Everything is under `businesses/{businessId}/` in the shared project, the business coming
from the signed-in admin's claim (`src/lib/business.ts`: `bizCol` / `bizDoc`). Security rules
live in the `asian-le-firebase` repo.

| Path | Used for |
|---|---|
| `orders` | Online orders written by the website; read live and updated here |
| `settings/store` | Pause ordering, wait time, hours (same doc as website / website-admin) |
| `webCategories`, `webMenuItems`, `webOptionGroups`, `webOptions` | The website menu; sold-out toggles |
| `onlinePrintQueue` | Print jobs for `print-server-orders` |
| `appConfig/ordersVersion` (top level) | Minimum app version (force update) |

## Project structure

```
app/                  Routes: login, and the (tabs) group (Live Orders, History, Menu, Settings)
src/services/         The only files that use Firestore: subscribeTo* listeners and mutations
src/hooks/            Thin wrappers around one subscription each (useLiveOrders, ...)
src/components/       OrderCard (shared by Live and History), modals, overlays, ui/ primitives
src/contexts/         AuthContext (sign-in, admin check, business)
src/navigation/       Tab list (native + web) and the web header
src/lib/              Firebase init, business path helpers
src/theme/            Colour tokens (shared with tailwind.config.js)
src/types/            Global types and enums (mirror the website's order contract)
```

More detail on the rewards flow and conventions is in `CLAUDE.md`.
