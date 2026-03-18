/**
 * Identity–auth bridge: exposes current auth state for System7.identity channel.
 * All identity must resolve through UniversalIdentity; no module may create its own user identity.
 * When capability.auth is on, universal-engine-adapter can call getIdentityPayload() and pass to System7.
 */

let currentUserSnapshot: { userId: string; name: string; role: string } | null = null;

let currentIdentitySnapshot: CurrentIdentity | null = null;

export type IdentityPayload = {
  userId: string | null;
  name: string;
  role: string;
};

export type CurrentIdentity = {
  userId: string | null;
  email: string;
  displayName: string;
  organizations: { organizationId: string; role: string }[];
  activeOrgId: string | null;
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
  if (currentIdentitySnapshot?.userId) {
    return {
      userId: currentIdentitySnapshot.userId,
      name: currentIdentitySnapshot.displayName,
      role: "user",
    };
  }
  return { userId: null, name: "", role: "guest" };
}

/**
 * Returns full identity from Universal Identity layer (userId, email, displayName, organizations, activeOrgId).
 * On client, fetches /api/identity/me. All apps must obtain identity from this bridge.
 */
export async function getCurrentIdentity(): Promise<CurrentIdentity> {
  if (typeof window === "undefined") {
    return {
      userId: null,
      email: "",
      displayName: "",
      organizations: [],
      activeOrgId: null,
    };
  }
  try {
    const base = window.location.origin;
    const res = await fetch(`${base}/api/identity/me`, { cache: "no-store" });
    if (!res.ok) {
      currentIdentitySnapshot = null;
      return {
        userId: null,
        email: "",
        displayName: "",
        organizations: [],
        activeOrgId: null,
      };
    }
    const data = (await res.json()) as CurrentIdentity;
    currentIdentitySnapshot = data;
    if (data.userId) {
      currentUserSnapshot = {
        userId: data.userId,
        name: data.displayName,
        role: "user",
      };
    }
    return data;
  } catch {
    currentIdentitySnapshot = null;
    return {
      userId: null,
      email: "",
      displayName: "",
      organizations: [],
      activeOrgId: null,
    };
  }
}

/**
 * Set identity from NextAuth session / Universal Identity (e.g. after /api/identity/me fetch).
 * Updates the snapshot so getIdentityPayload() returns universal userId.
 */
export function setIdentityFromSession(identity: CurrentIdentity): void {
  currentIdentitySnapshot = identity;
  if (identity.userId) {
    currentUserSnapshot = {
      userId: identity.userId,
      name: identity.displayName,
      role: "user",
    };
  } else {
    currentUserSnapshot = null;
  }
}

/**
 * Install listener on auth state (call once at app init).
 * If Firebase auth exists, subscribes and updates currentUserSnapshot.
 * NextAuth session should be reflected via getCurrentIdentity() or setIdentityFromSession().
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
        if (!currentIdentitySnapshot?.userId) currentUserSnapshot = null;
        return;
      }
      if (!currentIdentitySnapshot?.userId) {
        currentUserSnapshot = {
          userId: u.uid,
          name: u.displayName ?? u.email ?? "",
          role: "user",
        };
      }
    });
  }).catch(() => {
    if (!currentIdentitySnapshot?.userId) currentUserSnapshot = null;
  });
}
