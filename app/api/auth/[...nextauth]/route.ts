import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:5000";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("Login failed on backend. Status:", res.status, "Response:", errText);
            return null;
          }

          const result = await res.json();
          console.log("Login Success Result:", JSON.stringify(result));

          // Backend: { Success: true, Data: { Token, RefreshToken, Expiration, Claims } }
          if (!result.Success || !result.Data?.Token) {
            console.error("Login data format error. Success flag or token missing.");
            return null;
          }

          const { Token, RefreshToken, Expiration, Claims } = result.Data;
          const claimsList: string[] = Array.isArray(Claims) ? Claims : [];

          // JWT Token içinden kullanıcının gerçek Ad Soyad (FullName) ve ID bilgisini alıyoruz
          let fullName = credentials.email;
          let userId: number | undefined = undefined;
          let userRole = "";
          let userTenantId = 0;

          // TenantId claim kontrolü (Örn: "TenantId:2")
          const tenantClaim = claimsList.find((c) => typeof c === "string" && c.startsWith("TenantId:"));
          if (tenantClaim) {
            const tid = Number(tenantClaim.split(":")[1]);
            if (tid) userTenantId = tid;
          }

          if (Token) {
            try {
              const base64Payload = Token.split(".")[1];
              if (base64Payload) {
                const decodedPayload = JSON.parse(
                  Buffer.from(base64Payload, "base64").toString("utf-8")
                );
                fullName =
                  decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
                  decodedPayload["name"] ||
                  credentials.email;
                const idStr =
                  decodedPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
                  decodedPayload["nameid"] ||
                  decodedPayload["sub"];
                if (idStr) userId = Number(idStr);

                const rawTenantId =
                  decodedPayload["TenantId"] ||
                  decodedPayload["tenantid"] ||
                  decodedPayload["Tenantid"] ||
                  decodedPayload["tenant_id"];
                if (rawTenantId) userTenantId = Number(rawTenantId);

                const rawRole =
                  decodedPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
                  decodedPayload["role"];

                if (Array.isArray(rawRole)) {
                  userRole = rawRole[0] || "";
                } else if (typeof rawRole === "string") {
                  userRole = rawRole;
                }
              }
            } catch (e) {
              console.error("Token payload decode error:", e);
            }
          }

          const hasSuperAdminClaim =
            /super/i.test(userRole) ||
            claimsList.some((c) => /^SuperAdmin$|^SUPER_ADMIN$|^Super Admin$/i.test(c));

          if (hasSuperAdminClaim && userTenantId === 0) {
            userRole = "SUPER_ADMIN";
          } else {
            const matchedClaim = claimsList.find((c) =>
              /^KurumSahibi$|^Kurum Sahibi$|^TenantAdmin$|^SubeYonetici$|^OKUL_ADMIN$|^EDITOR$/i.test(c)
            );
            if (matchedClaim) {
              userRole = matchedClaim;
            } else if (!userRole || userRole === "Person" || userRole === "Unknown" || userRole === "SUPER_ADMIN") {
              userRole = "KurumSahibi";
            }
          }

          return {
            id: userId ? String(userId) : credentials.email,
            email: credentials.email,
            name: fullName,
            fullName: fullName,
            role: userRole,
            userRole: userRole,
            tenantId: userTenantId,
            claims: claimsList,
            accessToken: Token,
            refreshToken: RefreshToken,
            expiration: Expiration,
          };
        } catch (error: any) {
          console.error("Auth Exception:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.name = user.name;
        token.fullName = user.fullName;
        token.role = user.role;
        token.userRole = user.userRole;
        token.tenantId = user.tenantId;
        token.claims = user.claims;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiration = user.expiration;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).name = token.name || token.fullName;
        (session.user as any).fullName = token.fullName || token.name;
        (session.user as any).role = token.role;
        (session.user as any).userRole = token.userRole;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).claims = token.claims;
      }
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiration = token.expiration;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 8, // 8 saat
  },
  secret: process.env.NEXTAUTH_SECRET || "haqanwear-secret-key-12345",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
