"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "construction-banner-dismissed";

export default function ConstructionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-accent bg-white px-5 py-4 shadow-lg">
      <span className="text-sm leading-relaxed text-foreground">
        Nosso site ainda est&aacute; sendo preparado com carinho! Algumas informa&ccedil;&otilde;es podem mudar.
      </span>
      <button
        onClick={dismiss}
        aria-label="Fechar aviso"
        className="shrink-0 rounded p-0.5 text-lg leading-none text-muted transition-colors hover:text-foreground"
      >
        &times;
      </button>
    </div>
  );
}
