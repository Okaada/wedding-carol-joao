"use server";

import fs from "fs";
import path from "path";

export type RsvpResult = { success: boolean; error?: string };

export async function submitRsvp(
  _prev: RsvpResult,
  formData: FormData
): Promise<RsvpResult> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const cellphone = (formData.get("cellphone") as string | null)?.trim() ?? "";

  if (!name) {
    return { success: false, error: "Por favor, informe seu nome completo." };
  }
  if (!cellphone) {
    return { success: false, error: "Por favor, informe seu celular." };
  }

  const record = JSON.stringify({ name, cellphone, submittedAt: new Date().toISOString() });

  const dataDir = path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, "rsvp.json");

  fs.mkdirSync(dataDir, { recursive: true });
  fs.appendFileSync(filePath, record + "\n", "utf-8");

  return { success: true };
}
