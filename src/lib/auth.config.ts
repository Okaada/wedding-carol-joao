import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  providers: [],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "strict" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isAdminRoute && !isLoginPage && !isAuthenticated) {
        return Response.redirect(new URL("/admin/login", nextUrl));
      }
      if (isLoginPage && isAuthenticated) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
