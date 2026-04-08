import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isAuthenticated = !!req.auth;

  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    return Response.redirect(new URL("/admin/login", req.url));
  }

  if (isLoginPage && isAuthenticated) {
    return Response.redirect(new URL("/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
