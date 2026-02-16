"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "./firebaseClient";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "./authActions";
import { isNativePlatform } from "../nativeCapabilities";

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  authReady: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        await getRedirectResult(auth);
      } catch {
        // No pending redirect or error (e.g. user cancelled); continue.
      }
      if (cancelled) return;
      unsub = onAuthStateChanged(auth, (u) => {
        if (cancelled) return;
        setUser(u ?? null);
        setLoading(false);
        setAuthReady(true);
      });
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
    setUser(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    if (isNativePlatform()) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    await sendPasswordResetEmail(auth, email);
  }, []);

  return {
    user,
    loading,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    authReady,
  };
}
