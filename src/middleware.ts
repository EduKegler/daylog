import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/", req.url));
  }

  if (!isLoggedIn && pathname !== "/login") {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|apple-icon|opengraph-image|twitter-image).*)",
  ],
};
