import type { Auth, UserCredential } from "firebase/auth";
import type { AuthProvider } from "firebase/auth";

export async function signInWithPopup(auth: Auth, provider: AuthProvider): Promise<UserCredential> {
  const { signInWithPopup: fb } = await import("firebase/auth");
  return fb(auth, provider);
}

export async function signInWithEmailAndPassword(
  auth: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  const { signInWithEmailAndPassword: fb } = await import("firebase/auth");
  return fb(auth, email, password);
}

export async function createUserWithEmailAndPassword(
  auth: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  const { createUserWithEmailAndPassword: fb } = await import("firebase/auth");
  return fb(auth, email, password);
}

export async function sendPasswordResetEmail(auth: Auth, email: string): Promise<void> {
  const { sendPasswordResetEmail: fb } = await import("firebase/auth");
  return fb(auth, email);
}

export async function signOut(auth: Auth): Promise<void> {
  const { signOut: fb } = await import("firebase/auth");
  return fb(auth);
}

export function onAuthStateChanged(
  auth: Auth,
  callback: (user: import("firebase/auth").User | null) => void
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { onAuthStateChanged: fb } = require("firebase/auth");
  return fb(auth, callback);
}
