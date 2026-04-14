"use server";

import { randomUUID } from "crypto";
import { storeAuthState } from "@/lib/auth-utils";

export async function generateLoginState(): Promise<string> {
  const token = randomUUID();
  await storeAuthState(token);
  return token;
}
