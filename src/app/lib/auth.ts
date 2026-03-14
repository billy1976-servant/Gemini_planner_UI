import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getOrCreateUserByEmail } from "@/lib/universal-identity";

// One-time startup logging: required env and exact Google callback URL. Do NOT crash the app.
if (typeof process !== "undefined" && process.env) {
  const hasGoogle =
    !!process.env.GOOGLE_CLIENT_ID?.trim() && !!process.env.GOOGLE_CLIENT_SECRET?.trim();
  const hasSecret = !!process.env.NEXTAUTH_SECRET?.trim();
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || "";
  const callbackPath = "/api/auth/callback/google";
  const callbackUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}${callbackPath}` : "";

  if (!hasGoogle) {
    console.warn(
      "[auth] Google OAuth not configured. Set in .env.local: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (from Google Cloud Console → Credentials → OAuth 2.0 Client ID)."
    );
  }
  if (!hasSecret) {
    console.warn(
      "[auth] NEXTAUTH_SECRET missing. Set in .env.local (e.g. run: openssl rand -base64 32). Sessions and OAuth will fail without it."
    );
  }
  if (!baseUrl) {
    console.warn(
      "[auth] NEXTAUTH_URL not set. For local dev set in .env.local: NEXTAUTH_URL=http://localhost:3000 (or http://christian.localhost:3000 if using subdomain). Then add that exact origin + /api/auth/callback/google to Google Cloud Console → Authorized redirect URIs."
    );
  } else if (hasGoogle) {
    console.info("[auth] Google callback URL (add this to Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs):", callbackUrl);
  }
}

/**
 * For domain-router (e.g. christian.hiclarify.com): leave NEXTAUTH_URL unset in production
 * so NextAuth uses the request host for redirects and callbacks. Sign-in links pass
 * callbackUrl (e.g. /prayer) so Google login returns to the correct page.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/prayer",
    error: "/prayer",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.picture = user.image ?? undefined;
        const email = (user.email ?? "").trim();
        if (email) {
          try {
            const userRecord = await getOrCreateUserByEmail(
              email,
              user.name ?? undefined,
              "nextauth-google"
            );
            token.userId = userRecord.id;
          } catch (e) {
            console.error("[auth] getOrCreateUserByEmail:", e);
            // Fallback so room creation and other features still work (e.g. identity DB unavailable)
            token.userId = `google:${email}`;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? undefined;
        session.user.email = token.email ?? undefined;
        session.user.name = token.name ?? undefined;
        session.user.image = token.picture ?? undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
