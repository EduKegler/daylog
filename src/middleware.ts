import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api|test2|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|apple-icon|opengraph-image|twitter-image).*)",
  ],
};
