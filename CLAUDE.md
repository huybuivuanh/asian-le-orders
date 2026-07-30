# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Expo Router (React Native, universal iOS/Android/web) admin app for managing a restaurant's live orders, order history, menu, and store settings. It talks directly to Firebase (Firestore + Auth). The `orders` collection itself is written by a separate customer-facing website repo — this app reads/manages that data (accept, print, complete, cancel) rather than originating it.

## Commands

```bash
npm start          # expo start (dev server; press w/a/i or scan QR)
npm run web        # expo start --web
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run lint       # expo lint (eslint-config-expo flat config)
npx tsc --noEmit   # type-check the whole project — run this after any change
```

There is no test runner configured (no `test` script, no Jest) — type-checking with `tsc --noEmit` and `expo lint` are the available verification steps.

Firebase config is read from `EXPO_PUBLIC_FIREBASE_*` env vars in `.env` (gitignored).

## Architecture

### Routing and auth gating

`app/_layout.tsx` wraps everything in `AuthProvider` (`src/contexts/AuthContext.tsx`, Firebase Auth) and uses `Stack.Protected` to route to the `(tabs)` group when signed in or to `login` otherwise. `app/(tabs)/_layout.tsx` defines four tabs: Live Orders (`index`), Order History (`history`), Menu, Settings.

### Layered data flow: services → hooks → UI

This is the core structural convention — keep it intact when adding features:

- **`src/services/*.ts`** — the only files that import `firebase/firestore` (besides `src/lib/firebase.ts`, which just initializes the app/auth/db). Each exports `subscribeTo*` functions (wrap `onSnapshot`, take `onData`/`onError` callbacks, return the `Unsubscribe`) and plain async mutation functions (`acceptOrder`, `updateOrderStatus`, `updateStoreAcceptingOrders`, `updateStoreWaitTime`, `submitOrderToPrintQueue`).
- **`src/hooks/*.ts`** — thin `useState` + `useEffect` wrappers around a single `subscribeTo*` service call. They hold no Firestore imports and no business logic; a hook mounts a listener for its component's lifetime and never dedupes across callers (e.g. `useStoreSettings` used in two screens would open two independent listeners — there's no shared store/cache).
- **Components/screens** (`app/(tabs)/*.tsx`, `src/components/*.tsx`) call the hooks for reads and the service mutation functions directly for writes. They never import `firebase/firestore` themselves.
- **`src/utils/orderHelpers.ts`** is pure, UI-facing formatting/derivation only (`formatOrderDate`, `formatPhone`, `fulfillmentIsScheduled`, `fulfillmentScheduledAt`) — no Firestore imports belong here. Firestore document mapping (`mapOrderDoc`) lives in `src/services/orders.ts` instead.

### Firestore collections

- `orders` — written by the customer-facing website; this app reads it live (`subscribeToLiveOrders`: status `New`/`InProgress`, sorted client-side by `createdAt` desc) and for history (`subscribeToOrderHistory`: last 100 by `createdAt` desc). Order shape and enums (`OrderStatus`, `TakeOutFulfillmentKind`) in `src/types/global.d.ts` / `src/types/enum.ts` mirror that website's contract.
- `settings/store` — single doc (`StoreSettings`: `pauseOrdering`, `waitTime`, `hours`, `holidays`, `timezone`). `src/services/storeSettings.ts` provides a `DEFAULT_STORE_SETTINGS` fallback for when the doc doesn't exist yet. Same doc path convention as the sibling `asian-le-website`/`asian-le-website-admin` repos (`doc(db, "settings", "store")`) — keep that path in sync if it's ever restructured.
- `printQueue` — write path only from this app. `submitOrderToPrintQueue` (in `src/services/printQueue.ts`) keys the doc by `order.id`: if a queue doc already exists it just flips `printed` back to `false` (a reprint signal for whatever printer worker consumes this collection), otherwise it creates a new doc from the full order plus `printed: false`. It intentionally does not touch the order's own `createdAt`.

### `OrderCard` is shared, not duplicated per screen

`src/components/OrderCard.tsx` renders both the Live Orders list (`showActions` defaults `true`) and Order History list (`showActions={false}`). Status/mode drive what's visible rather than separate components:
- Badges (Printed/Paid/Status) always show; the Paid badge fades to `opacity-0` (not unmounted, to preserve layout) when it's not meaningful (cancelled, or completed-unpaid).
- The Ready-In-minutes stepper and Accept button only show for `OrderStatus.New`; the stepper's default seeds from the live `settings.waitTime` (passed down as `defaultReadyMinutes` from `index.tsx`, not fetched per-card) unless the order already has its own `readyTimeMinutes`.
- Complete/Cancel/Print live inside the expanded section (`showOrderActions = showActions && status !== New`); History gets a standalone Print button instead since it never shows the full action row.
- Card background color is fully status-driven (Cancelled → red, Completed → green, New → pink, scheduled → orange, else blue) — this logic intentionally mirrors the sibling POS repos' order-card coloring.

### Styling

NativeWind v4 (Tailwind classes via `className`) throughout — no `StyleSheet.create`. `@/*` resolves to `src/*` (see `tsconfig.json`).

### Sibling repos

This project is one of several sharing the same Firebase project: a customer-facing ordering website, a website admin, and POS apps (dine-in/takeout). When matching UI or data conventions (badge layouts, button rows, Firestore doc paths), check those sibling repos rather than inventing a new convention.
