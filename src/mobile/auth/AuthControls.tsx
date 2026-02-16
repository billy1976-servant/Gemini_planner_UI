"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";
import AuthModal from "./AuthModal";
import { isFirebaseConfigured } from "./firebaseClient";

export default function AuthControls() {
  const { user, loading, signOut, authReady } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (!authReady || loading) return null;

  const showBanner = !user && !isFirebaseConfigured();

  return (
    <>
      {showBanner && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            padding: "6px 12px",
            borderRadius: 6,
            background: "#fef3c7",
            color: "#92400e",
            fontSize: 12,
            border: "1px solid #f59e0b",
            maxWidth: "90vw",
          }}
          role="status"
        >
          Sign-in not configured (missing Firebase env). Add{" "}
          <code style={{ background: "rgba(0,0,0,0.06)", padding: "0 4px", borderRadius: 4 }}>NEXT_PUBLIC_FIREBASE_*</code> to{" "}
          <code style={{ background: "rgba(0,0,0,0.06)", padding: "0 4px", borderRadius: 4 }}>.env.local</code> — see .env.example.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user ? (
          <>
            <span style={{ fontSize: 11, color: "#333", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }} title={user.email ?? undefined}>
              {user.email ?? user.uid}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                border: "1px solid #333",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              border: "1px solid #333",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        )}
      </div>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
