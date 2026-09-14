import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sadece /admin ile başlayan rotaları koruyoruz
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/unauthorized") {
      return NextResponse.next();
    }

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "haqanwear-secret-key-12345",
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (token.role as string) || (token.userRole as string) || "";
    const userTenantId = Number(token.tenantId ?? 0);
    const claims: string[] = Array.isArray(token.claims) ? (token.claims as string[]) : [];

    const isSuperAdmin =
      (userRole.toUpperCase() === "SUPER_ADMIN" ||
        userRole.toUpperCase() === "SUPERADMIN" ||
        claims.some((c) => /^superadmin$|^SUPER_ADMIN$/i.test(c))) &&
      userTenantId === 0;

    // Sadece SUPER_ADMIN için rota kısıtlaması uygula
    if (isSuperAdmin) {
      const superAdminAllowedPrefixes = [
        "/admin/tenants",
        "/admin/branches",
        "/admin/users",
        "/admin/roles",
        "/admin/profile",
        "/admin/unauthorized",
      ];

      const isExactAdminDashboard = pathname === "/admin" || pathname === "/admin/";
      const isAllowedPrefix = superAdminAllowedPrefixes.some((prefix) =>
        pathname.startsWith(prefix)
      );

      if (!isExactAdminDashboard && !isAllowedPrefix) {
        return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
