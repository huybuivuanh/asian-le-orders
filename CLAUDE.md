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

Expo SDK 58 (React Native 0.88). `.npmrc` sets `legacy-peer-deps=true` because `@react-native-community/datetimepicker`'s optional `react-native-windows` peer pins an older react-native; keep it or `npm install` / EAS builds fail. Side effect: npm no longer auto-installs peer deps, so required peers are listed explicitly in devDependencies (`react-refresh` pinned to the `^0.14.2` that expo/react-native use — without it bundling fails with "Cannot find module 'react-refresh/babel'"; `prettier` for `prettier-plugin-tailwindcss`). `patches/react-native+0.88.1.patch` (applied by `postinstall`) guards the iOS `BlobModule` handler against the `Updates.reloadAsync()` crash; re-create it when bumping react-native. On Windows, `npx patch-package` needs `core.autocrlf=false` and `core.longpaths=true` for git, or it crashes.

## Architecture

### Routing and auth gating

`app/_layout.tsx` wraps everything in `AuthProvider` (`src/contexts/AuthContext.tsx`, Firebase Auth) and uses `Stack.Protected` to route to the `(tabs)` group when signed in or to `login` otherwise. `app/(tabs)/_layout.tsx` defines four tabs: Live Orders (`index`), Order History (`history`), Menu, Settings. The tab list lives in `src/navigation/tabs.ts` (label + SF Symbol / Material / Ionicons icon). iOS/Android use `NativeTabs` (real native tab bar); web uses JS `Tabs` with `src/navigation/WebTabBar.tsx` as a top header (tabs on wide screens, hamburger menu under 768px via `useIsWide`). Same approach as the `asian-le-rewards` repo.

### Layered data flow: services → hooks → UI

This is the core structural convention — keep it intact when adding features:

- **`src/services/*.ts`** — the only files that import `firebase/firestore` (besides `src/lib/firebase.ts`, which just initializes the app/auth/db). Each exports `subscribeTo*` functions (wrap `onSnapshot`, take `onData`/`onError` callbacks, return the `Unsubscribe`) and plain async mutation functions (`acceptOrder`, `updateOrderStatus`, `updateStoreAcceptingOrders`, `updateStoreWaitTime`, `submitOrderToPrintQueue`).
- **`src/hooks/*.ts`** — thin `useState` + `useEffect` wrappers around a single `subscribeTo*` service call. They hold no Firestore imports and no business logic; a hook mounts a listener for its component's lifetime and never dedupes across callers (e.g. `useStoreSettings` used in two screens would open two independent listeners — there's no shared store/cache).
- **Components/screens** (`app/(tabs)/*.tsx`, `src/components/*.tsx`) call the hooks for reads and the service mutation functions directly for writes. They never import `firebase/firestore` themselves.
- **`src/utils/orderHelpers.ts`** is pure, UI-facing formatting/derivation only (`formatOrderDate`, `formatPhone`, `fulfillmentIsScheduled`, `fulfillmentScheduledAt`) — no Firestore imports belong here. Firestore document mapping (`mapOrderDoc`) lives in `src/services/orders.ts` instead.

### Firestore collections

One Firebase project (`asianlepos`) is shared with the POS, KDS, website and rewards. **All data is under `businesses/{businessId}/`** — build paths with `bizCol` / `bizDoc` from `src/lib/business.ts`. The business comes from the signed-in account's `businessId` custom claim; only the `admin` role can sign in (staff are refused) (`AuthContext` checks after sign-in and on restore, and saves the business for offline restarts). Rules live in the separate `asian-le-firebase` repo. The App Store review Demo is just another business.

- `orders` — written by the customer-facing website; this app reads it live (`subscribeToLiveOrders`: status `New`/`InProgress`, sorted client-side by `createdAt` desc) and for history (`subscribeToOrderHistory`: last 100 by `createdAt` desc). Order shape and enums (`OrderStatus`, `TakeOutFulfillmentKind`) in `src/types/global.d.ts` / `src/types/enum.ts` mirror that website's contract.
- `settings/store` — single doc (built by `storeSettingsDoc()` — a function because the business is only known after sign-in) (`StoreSettings`: `pauseOrdering`, `waitTime`, `hours`, `holidays`, `timezone`). `src/services/storeSettings.ts` provides a `DEFAULT_STORE_SETTINGS` fallback for when the doc doesn't exist yet. Same doc as the website / website-admin — keep that path in sync if it's ever restructured.
- `webCategories` / `webMenuItems` / `webOptionGroups` / `webOptions` — the website's menu (the POS has its own `menuItems` etc.); the Menu tab reads them and toggles sold-out on `webMenuItems` / `webOptions` (`src/services/menuData.ts`).
- `appConfig/ordersVersion` (top level, not per business; the POS uses `appConfig/posVersion`) — force update, copied from AsianLePOS (`{ minVersion, iosUpdateUrl, androidUpdateUrl }`). `useForceUpdate` (via `src/services/appConfig.ts`) listens live from the `(tabs)` layout. If `app.json`'s `version` is lower than `minVersion`, the tabs are replaced by `ForceUpdateScreen`. Native only; web is skipped.
- `onlinePrintQueue` (the POS has its own `printQueue`) — write path only from this app. `submitOrderToPrintQueue` (in `src/services/printQueue.ts`) keys the doc by `order.id`: every print (first or reprint) overwrites the doc with the current full order plus `printed: false`, so reprints show later changes (discount removed, extra charge). `printed: false` is what makes the print server print it. It intentionally does not touch the order's own `createdAt`.

### Rewards (Asian Le Rewards)

The website lets customers sign in to Asian Le Rewards at checkout and saves `order.loyalty = { memberId, memberName }` (same field as the POS). This app collects the points: `OrderCard`'s Complete calls `collectOrderPoints` (`src/services/rewards.ts` → the rewards `earnPoints` Cloud Function (codebase `rewards`, same project), then writes `loyalty.pointsEarned` / `loyalty.collectedAt`) **before** marking the order Completed. If that fails, staff can complete anyway and use "Collect rewards points" on the card in Order History. `earnPoints` is keyed by order id, so retries never double-count. The functions are called with the staff login and take the business from its `businessId` claim. Cancel: normally no points exist yet (they're collected on Complete, and completed orders can't be cancelled here). If points were collected but the Completed write failed, Cancel first calls `reverseOrderPoints` (`reverseOrder` function, writes `loyalty.reversedAt` / `pointsReversed`); on failure staff can cancel anyway (`loyalty.reversePending: true`) and use "Remove rewards points" in Order History.

Using points for money off: the website prices it (`taxBreakDown.discount`, POS shape, 100 pts = $5) and saves `loyalty.pointsToRedeem`, but doesn't take the points. Complete runs `settleOrderRewards`: `redeemOrderPoints` (rewards `redeemPoints`, writes `loyalty.pointsRedeemed` / `redeemedAmount` / `redeemedAt`), then `collectOrderPoints` on the **discounted** subtotal. If the member no longer has the points (`NotEnoughPointsError`), staff get "Remove discount" (`removeRewardsDiscount` → full-price `taxBreakDown`, `pointsToRedeem` deleted, then earn and complete). From History (already paid at the discount) it's "Skip & collect" (`waiveRedeem` → `loyalty.redeemWaived`). Add extra charge keeps the discount. `reverseOrder` on cancel undoes both the taken and the earned points.

### `OrderCard` is shared, not duplicated per screen

`src/components/OrderCard.tsx` renders both the Live Orders list (`showActions` defaults `true`) and Order History list (`showActions={false}`). Status/mode drive what's visible rather than separate components:
- Badges (Printed/Paid/Status) always show; the Paid badge fades to `opacity-0` (not unmounted, to preserve layout) when it's not meaningful (cancelled, or completed-unpaid).
- The Ready-In-minutes stepper and Accept button only show for `OrderStatus.New`; the stepper's default seeds from the live `settings.waitTime` (passed down as `defaultReadyMinutes` from `index.tsx`, not fetched per-card) unless the order already has its own `readyTimeMinutes`.
- Complete/Cancel/Print live inside the expanded section (`showOrderActions = showActions && status !== New`); History gets a standalone Print button instead since it never shows the full action row.
- Card background color is fully status-driven (Cancelled → red, Completed → green, New → pink, scheduled → orange, else blue) — this logic intentionally mirrors the sibling POS repos' order-card coloring.

### Styling

NativeWind v4 (Tailwind classes via `className`) throughout — no `StyleSheet.create`. `@/*` resolves to `src/*` (see `tsconfig.json`).

The look matches `asian-le-website-admin` so the suite feels like one product: brand tokens `ink`, `ink-raised`, `ink-line`, `on-ink`, `on-ink-muted`, `gold`, `foreground` (same names as the website/admin Tailwind themes) are defined in `src/theme/colors.js` and registered in `tailwind.config.js`. Use the classes (`bg-ink`, `text-gold`, `text-foreground/60`, `border-foreground/10`) and use `colors.*` only where a class can't go (icon/Switch/placeholder colors, navigation options). Shared pieces in `src/components/ui/`: `Button` (primary = near-black, secondary = outlined, danger/dangerOutline = red-600, ghost), `Card` (white, rounded-xl, light border, like the admin's settings cards), `ModalCard` (the admin's AppModal dialog), `Wordmark` ("ASIAN [logo] LE ORDERS", `assets/logo.png` from the admin). The web header is dark ink with gold active tabs, like the admin navbar. `OrderCard`'s status colors and action buttons are deliberately left as they are (they mirror the POS).

### Sibling repos

This project is one of several sharing the same Firebase project: a customer-facing ordering website, a website admin, and POS apps (dine-in/takeout). When matching UI or data conventions (badge layouts, button rows, Firestore doc paths), check those sibling repos rather than inventing a new convention.
