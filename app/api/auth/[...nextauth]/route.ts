// app/api/auth/[...nextauth]/route.ts (or wherever your NextAuth route lives)
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await response.json();

          // expected shape (based on your response):
          // {
          //   success: true,
          //   access_token: "...",
          //   expires_in: 1209600,
          //   refresh_token: "...",
          //   user: { id: 1, email: "...", role: "admin", ... }
          // }

          if (response.ok && data.success) {
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              role: data.user.role,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: data.expires_in, // seconds
              tokenType: data.token_type,
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // Persist token fields into the JWT
    async jwt({ token, user }) {
      // First sign-in (user present)
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.sub = (user as any).id; // set subject to id string

        // set expiry timestamp (ms) if provided
        const expiresIn = (user as any).expiresIn;
        if (expiresIn) {
          token.accessTokenExpires = Date.now() + expiresIn * 1000;
        }
      }

      // NOTE: you can add refresh-token logic here if token expired:
      // if (Date.now() < token.accessTokenExpires) return token
      // otherwise call API to refresh using token.refreshToken and update token fields

      return token;
    },

    // Make token fields available in the session
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;

      // keep role & id on session.user
      session.user = {
        ...session.user,
        id: (token.sub as string) ?? session.user?.email ?? "",
        role: (token.role as string) ?? session.user?.role ?? "",
        email: session.user?.email ?? undefined,
      } as any;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
