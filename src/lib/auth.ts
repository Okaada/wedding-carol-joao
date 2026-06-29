import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

class RateLimitError extends CredentialsSignin {
  code = "rate_limited";
}
import bcrypt from "bcryptjs";
import { getMongoClient } from "./mongodb";
import { authConfig } from "./auth.config";
import {
  normalizeEmail,
  ensureSecurityIndexes,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  logAuthEvent,
  validateAuthState,
  dummyBcryptCompare,
} from "./auth-utils";

function readFirstIp(value: string | null | undefined): string {
  if (!value) return "unknown";
  const first = value.split(",")[0]?.trim();
  return first || "unknown";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        loginState: { label: "Login State", type: "text" },
      },
      async authorize(credentials, request) {
        await ensureSecurityIndexes();

        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const loginState = credentials?.loginState as string | undefined;
        if (!email || !password) return null;

        // Validate login state token (server-side CSRF check)
        if (!loginState || !(await validateAuthState(loginState))) {
          return null;
        }

        const normalized = normalizeEmail(email);
        const ip = readFirstIp(
          (request as Request).headers?.get?.("x-forwarded-for"),
        );
        const userAgent =
          (request as Request).headers?.get?.("user-agent") ?? "unknown";

        // Check rate limit before doing any DB work
        const { locked } = await checkRateLimit(normalized, ip);
        if (locked) {
          await logAuthEvent(normalized, "login_lockout", ip, userAgent);
          throw new RateLimitError();
        }

        const client = await getMongoClient();
        const user = await client
          .db("carol-joao")
          .collection("admin_users")
          .findOne({ email: normalized });

        if (!user) {
          // Run a dummy bcrypt compare so the response time matches the
          // valid-email path and does not leak user existence via timing.
          await dummyBcryptCompare(password);
          await recordFailedAttempt(normalized, ip);
          await logAuthEvent(normalized, "login_failure", ip, userAgent);
          return null;
        }

        const valid = await bcrypt.compare(
          password,
          user.passwordHash as string,
        );
        if (!valid) {
          await recordFailedAttempt(normalized, ip);
          await logAuthEvent(normalized, "login_failure", ip, userAgent);
          return null;
        }

        // Success — clear rate limit and log
        await clearAttempts(normalized, ip);
        await logAuthEvent(normalized, "login_success", ip, userAgent);

        return {
          id: user._id.toString(),
          email: user.email as string,
          name: user.name as string,
        };
      },
    }),
  ],
});
