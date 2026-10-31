// Second Firebase connection: the Asian Le Rewards (loyalty) project — same setup as the
// POS (AsianLePOS/src/lib/rewardsFirebase.ts). Each device signs in once as the shared
// POS account from Settings → Rewards; the login is remembered and kept separate from the
// staff login. The password is never stored in .env.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, initializeAuth } from "firebase/auth";
import { type Functions, getFunctions } from "firebase/functions";
import { Platform } from "react-native";

// See src/lib/firebase.ts for why this import needs the expect-error.
// @ts-expect-error - RN-only export missing from firebase/auth's type declarations
import { getReactNativePersistence } from "firebase/auth";

const REWARDS_APP_NAME = "rewards";

// Public client config. Optional: without it the app works as before and the Rewards
// card in Settings says rewards isn't set up.
const rewardsConfig = {
  apiKey: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_REWARDS_FIREBASE_APP_ID,
};

export const rewardsConfigured = Boolean(
  rewardsConfig.apiKey && rewardsConfig.projectId && rewardsConfig.appId,
);

let rewardsAuth: Auth | null = null;
let rewardsFunctions: Functions | null = null;

if (rewardsConfigured) {
  const rewardsApp: FirebaseApp = getApps().some((a) => a.name === REWARDS_APP_NAME)
    ? getApp(REWARDS_APP_NAME)
    : initializeApp(rewardsConfig, REWARDS_APP_NAME);

  // Persistence keys include the app name, so this login is stored separately.
  rewardsAuth =
    Platform.OS === "web"
      ? getAuth(rewardsApp)
      : initializeAuth(rewardsApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });

  rewardsFunctions = getFunctions(rewardsApp);
}

export { rewardsAuth, rewardsFunctions };
