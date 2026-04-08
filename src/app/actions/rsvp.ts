"use server";

import { getMongoClient } from "@/lib/mongodb";

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

  try {
    const client = await getMongoClient();
    const collection = client.db("carol-joao").collection("rsvp");
    await collection.insertOne({ name, cellphone, submittedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error: "Não foi possível confirmar sua presença. Tente novamente em alguns instantes.",
    };
  }
}
