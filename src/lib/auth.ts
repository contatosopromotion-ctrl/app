import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called with email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] missing credentials");
          return null;
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              influencer: true,
            },
          });
        } catch (e) {
          console.error("[AUTH] prisma error:", e);
          return null;
        }

        if (!user) {
          console.log("[AUTH] user not found:", credentials.email);
          return null;
        }

        console.log("[AUTH] user found, comparing password...");
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        console.log("[AUTH] password valid:", isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "SUPER_ADMIN" | "BRAND_ADMIN" | "INFLUENCER",
          tenantId: user.tenantId ?? undefined,
          influencerId: user.influencer?.id ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.influencerId = user.influencerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUPER_ADMIN" | "BRAND_ADMIN" | "INFLUENCER";
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.influencerId = token.influencerId as string | undefined;
      }
      return session;
    },
  },
};
