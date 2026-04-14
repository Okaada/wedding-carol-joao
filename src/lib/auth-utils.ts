import { getMongoClient } from "./mongodb";

const DB_NAME = "carol-joao";

// ─── Email normalization ───────────────────────────────────────────
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ─── Password validation ───────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      error:
        "A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula e número.",
    };
  }
  return { valid: true };
}

// ─── TTL Index initialization ──────────────────────────────────────
let indexesEnsured = false;

export async function ensureSecurityIndexes(): Promise<void> {
  if (indexesEnsured) return;

  const client = await getMongoClient();
  const db = client.db(DB_NAME);

  await Promise.all([
    db
      .collection("login_attempts")
      .createIndex({ firstAttempt: 1 }, { expireAfterSeconds: 15 * 60 }),
    db
      .collection("login_audit")
      .createIndex({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }),
    db
      .collection("auth_states")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 10 * 60 }),
  ]);

  indexesEnsured = true;
}

// ─── Rate limiting ─────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;

export async function checkRateLimit(
  email: string,
): Promise<{ locked: boolean }> {
  const normalized = normalizeEmail(email);
  const client = await getMongoClient();
  const doc = await client
    .db(DB_NAME)
    .collection("login_attempts")
    .findOne({ email: normalized });

  if (doc && (doc.count as number) >= MAX_ATTEMPTS) {
    return { locked: true };
  }
  return { locked: false };
}

export async function recordFailedAttempt(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const client = await getMongoClient();
  await client
    .db(DB_NAME)
    .collection("login_attempts")
    .updateOne(
      { email: normalized },
      {
        $inc: { count: 1 },
        $setOnInsert: { firstAttempt: new Date() },
      },
      { upsert: true },
    );
}

export async function clearAttempts(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const client = await getMongoClient();
  await client
    .db(DB_NAME)
    .collection("login_attempts")
    .deleteOne({ email: normalized });
}

// ─── Audit logging ─────────────────────────────────────────────────
export type AuthAction = "login_success" | "login_failure" | "login_lockout";

export async function logAuthEvent(
  email: string,
  action: AuthAction,
  ip: string,
  userAgent: string,
): Promise<void> {
  const client = await getMongoClient();
  await client
    .db(DB_NAME)
    .collection("login_audit")
    .insertOne({
      email: normalizeEmail(email),
      action,
      ip,
      userAgent,
      timestamp: new Date(),
    });
}

// ─── Auth state storage ────────────────────────────────────────────
export async function storeAuthState(token: string): Promise<void> {
  const client = await getMongoClient();
  await client
    .db(DB_NAME)
    .collection("auth_states")
    .insertOne({ token, createdAt: new Date() });
}

export async function validateAuthState(token: string): Promise<boolean> {
  const client = await getMongoClient();
  const doc = await client
    .db(DB_NAME)
    .collection("auth_states")
    .findOneAndDelete({ token });
  return doc !== null;
}
