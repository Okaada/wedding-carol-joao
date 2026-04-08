"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RsvpSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/admin/rsvp?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nome ou celular..."
        className="w-full max-w-sm rounded-lg border border-accent bg-white px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
      >
        Buscar
      </button>
    </form>
  );
}
