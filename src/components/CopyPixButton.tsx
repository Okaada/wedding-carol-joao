"use client";

import { useState } from "react";

export default function CopyPixButton({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-light"
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}
