"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";
import AuthModal from "./AuthModal";

export default function AuthControls() {
  const { user, loading, signOut, authReady } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (!authReady || loading) return null;

  return (
    <>
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
