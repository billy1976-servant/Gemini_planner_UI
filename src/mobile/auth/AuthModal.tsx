"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";
import { isFirebaseConfigured } from "./firebaseClient";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const disabled = !isFirebaseConfigured();

  if (!open) return null;

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Check your email for a reset link.");
        return;
      }
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>HI Clarify — Sign in</h3>
        {disabled && (
          <p
            style={{ color: "#c00", fontSize: 12, marginBottom: 12 }}
            role="alert"
          >
            Firebase not configured. Add <code style={{ background: "#f0f0f0", padding: "0 4px", borderRadius: 4 }}>NEXT_PUBLIC_FIREBASE_API_KEY</code> and <code style={{ background: "#f0f0f0", padding: "0 4px", borderRadius: 4 }}>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> to a <code style={{ background: "#f0f0f0", padding: "0 4px", borderRadius: 4 }}>.env.local</code> file in the project root, then restart the dev server.
          </p>
        )}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "10px 16px",
            marginBottom: 12,
            border: "1px solid #ccc",
            borderRadius: 6,
            cursor: disabled ? "not-allowed" : "pointer",
            background: "#fff",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Sign in with Google
        </button>
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={mode !== "forgot"}
            style={{
              width: "100%",
              padding: "8px 12px",
              marginBottom: 8,
              boxSizing: "border-box",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === "signin" || mode === "signup"}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginBottom: 8,
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
          )}
          {error && <p style={{ color: "#c00", fontSize: 12, margin: "4px 0" }}>{error}</p>}
          {message && <p style={{ color: "#060", fontSize: 12, margin: "4px 0" }}>{message}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button
              type="submit"
              disabled={disabled}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {mode === "forgot" ? "Send reset link" : mode === "signup" ? "Sign up" : "Sign in"}
            </button>
            {mode !== "forgot" && (
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                style={{ padding: "8px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: 12 }}
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            )}
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                style={{ padding: "8px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: 12 }}
              >
                Forgot password
              </button>
            )}
          </div>
        </form>
        <button
          type="button"
          onClick={onClose}
          style={{ marginTop: 16, padding: "6px 12px", cursor: "pointer" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
