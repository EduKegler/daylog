import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { authConfig } from "./config";
import { DEFAULT_TIMEZONE } from "@/lib/guest/constants";
import type {} from "./types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (!token.timezone && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { timezone: true },
        });
        token.timezone = dbUser?.timezone ?? DEFAULT_TIMEZONE;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.timezone =
        (token.timezone as string) ?? DEFAULT_TIMEZONE;
      return session;
    },
  },
});
