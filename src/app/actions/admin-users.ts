"use server";

import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Nao autorizado");
  return session;
}

export type UserResult = { success: boolean; error?: string };

export async function getAdminUsers() {
  await requireAuth();

  const client = await getMongoClient();
  const users = await client
    .db("carol-joao")
    .collection("admin_users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map((u) => ({
    _id: u._id.toString(),
    name: u.name as string,
    email: u.email as string,
    createdAt: u.createdAt as string,
  }));
}

export async function createAdminUser(
  _prev: UserResult,
  formData: FormData,
): Promise<UserResult> {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!name) return { success: false, error: "Nome e obrigatorio." };
  if (!email) return { success: false, error: "Email e obrigatorio." };
  if (!password || password.length < 6) {
    return { success: false, error: "Senha deve ter no minimo 6 caracteres." };
  }

  try {
    const client = await getMongoClient();
    const collection = client.db("carol-joao").collection("admin_users");

    const existing = await collection.findOne({ email });
    if (existing) {
      return { success: false, error: "Ja existe um usuario com este email." };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await collection.insertOne({
      email,
      passwordHash,
      name,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao criar usuario." };
  }
}

export async function deleteAdminUser(id: string): Promise<UserResult> {
  const session = await requireAuth();

  try {
    const client = await getMongoClient();
    const collection = client.db("carol-joao").collection("admin_users");

    const user = await collection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return { success: false, error: "Usuario nao encontrado." };
    }

    if (user.email === session.user?.email) {
      return { success: false, error: "Voce nao pode remover seu proprio usuario." };
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao remover usuario." };
  }
}
