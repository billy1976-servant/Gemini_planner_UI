"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/mobile/auth/firebaseClient";

/**
 * Minimal Google auth UI: shows "Sign in with Google" when logged out,
 * or user email + Sign out when logged in. Session is persisted by Firebase Auth.
 */
export default function GoogleLoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AUTH DEBUG: verify .env.local is loaded (check browser console)
  console.log("[GoogleLoginButton] NEXT_PUBLIC_FIREBASE_API_KEY defined?", typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "undefined");

  useEffect(() => {
    const auth = getFirebaseAuth();
    // AUTH DEBUG: confirm Firebase init (check browser console)
    console.log("[GoogleLoginButton] getFirebaseAuth() result:", auth ? "initialized" : "null (missing env or SSR)");
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setError(null);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase not configured");
      return;
    }
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      setError(message);
    }
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-out failed";
      setError(message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 8, fontSize: 14, color: "var(--color-text-secondary, #666)" }}>
        Checking auth…
      </div>
    );
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    return (
      <div style={{ padding: 8, fontSize: 14, color: "var(--color-text-secondary, #666)" }}>
        Sign-in not configured (missing Firebase env).
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "8px 12px",
        fontSize: 14,
      }}
    >
      {user ? (
        <>
          <span style={{ color: "var(--color-text-primary, #111)" }}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: "var(--color-bg-secondary, #f5f5f5)",
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "var(--color-bg-secondary, #f5f5f5)",
            fontWeight: 500,
          }}
        >
          Sign in with Google
        </button>
      )}
      {error && (
        <span style={{ color: "var(--color-error, #c00)", fontSize: 13 }}>{error}</span>
      )}
    </div>
  );
}
