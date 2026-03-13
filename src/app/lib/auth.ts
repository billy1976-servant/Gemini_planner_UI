import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getOrCreateUserByEmail } from "@/lib/universal-identity";

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
