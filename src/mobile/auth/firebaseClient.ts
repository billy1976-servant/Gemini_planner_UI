import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (!app) {
    const apps = getApps();
    app = apps.length ? (apps[0] as FirebaseApp) : initializeApp(firebaseConfig);
  }
  if (!auth) auth = getAuth(app);
  return auth;
}

export const googleProvider = new GoogleAuthProvider();
