"use client";

import { useState } from "react";
import { togglePanicMode } from "@/app/actions/admin-settings";

interface Props {
  enabled: boolean;
}

export default function PanicModeToggle({ enabled }: Props) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    const result = await togglePanicMode(newValue);
    if (!result.success) {
      setIsEnabled(!newValue);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        isEnabled ? "bg-red-500" : "bg-accent"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
          isEnabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
