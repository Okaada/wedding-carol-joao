"use client";

import { deleteAdminUser } from "@/app/actions/admin-users";
import { useState } from "react";

export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja remover "${userName}"?`)) return;

    setLoading(true);
    const result = await deleteAdminUser(userId);
    setLoading(false);

    if (result.error) {
      alert(result.error);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
    >
      {loading ? "Removendo..." : "Remover"}
    </button>
  );
}
