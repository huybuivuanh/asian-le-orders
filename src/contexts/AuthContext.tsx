import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { checkAccessAndSetBusiness } from "@/lib/business";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/** Thrown by signIn when the account isn't staff/admin of a business. */
export class AccessError extends Error {}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Show the user only once their claims allow this app and the business is set.
    // The access check is async; only the latest auth event counts.
    let latest = 0;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      const run = ++latest;
      if (!nextUser) {
        setUser(null);
        setInitializing(false);
        return;
      }
      const access = await checkAccessAndSetBusiness(nextUser);
      if (run !== latest) return;
      if (!access.ok) {
        await firebaseSignOut(auth); // fires again with null
        return;
      }
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    initializing,
    signIn: async (email, password) => {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email, password);
      const access = await checkAccessAndSetBusiness(signedIn);
      if (!access.ok) {
        await firebaseSignOut(auth);
        throw new AccessError(access.message);
      }
    },
    signOut: async () => {
      await firebaseSignOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
