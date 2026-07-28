import AsyncStorage from "@react-native-async-storage/async-storage";
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

// firebase's package.json lists the "types" export condition before
// "react-native", so TS always resolves the generic (non-RN) auth types
// here even with customConditions set — the runtime export exists and
// Metro resolves it correctly, only the type declaration is missing.
// @ts-expect-error - see comment above
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);

// Web uses browser storage for persistence automatically; native needs
// AsyncStorage wired in explicitly via initializeAuth.
export const auth: Auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export default app;
