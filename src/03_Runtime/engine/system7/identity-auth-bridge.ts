/**
 * Identity–auth bridge: exposes current auth state for System7.identity channel.
 * Does NOT implement auth; only reads existing auth surface (Firebase if present).
 * When capability.auth is on, universal-engine-adapter can call getIdentityPayload() and pass to System7.
 */

let currentUserSnapshot: { userId: string; name: string; role: string } | null = null;

export type IdentityPayload = {
  userId: string | null;
  name: string;
  role: string;
};

/**
 * Returns identity payload from current auth snapshot (if any).
 * Call from adapter when routing to identity channel and auth capability is on.
 */
export function getIdentityPayload(): IdentityPayload {
  if (currentUserSnapshot) {
    return {
      userId: currentUserSnapshot.userId,
      name: currentUserSnapshot.name,
      role: currentUserSnapshot.role,
    };
  }
  return { userId: null, name: "", role: "guest" };
}

/**
 * Install listener on auth state (call once at app init).
 * If Firebase auth exists, subscribes and updates currentUserSnapshot.
 */
export function installIdentityAuthBridge(): void {
  if (typeof window === "undefined") return;
  void Promise.all([
    import("@/mobile/auth/firebaseClient"),
    import("@/mobile/auth/authActions"),
  ]).then(([fc, aa]) => {
    const auth = fc.getFirebaseAuth();
    if (!auth) return;
    aa.onAuthStateChanged(auth, (u) => {
      if (!u) {
        currentUserSnapshot = null;
        return;
      }
      currentUserSnapshot = {
        userId: u.uid,
        name: u.displayName ?? u.email ?? "",
        role: "user",
      };
    });
  }).catch(() => {
    currentUserSnapshot = null;
  });
}
