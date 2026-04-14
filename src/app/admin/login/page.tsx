"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateLoginState } from "@/app/actions/auth-state";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginState, setLoginState] = useState("");

  useEffect(() => {
    generateLoginState().then(setLoginState);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      loginState,
      redirect: false,
    });

    setLoading(false);

    if (result?.code === "rate_limited") {
      setError("Muitas tentativas de login. Tente novamente em 15 minutos.");
      generateLoginState().then(setLoginState);
    } else if (result?.error) {
      setError("Email ou senha incorretos.");
      generateLoginState().then(setLoginState);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground">
          Painel Admin
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          Carol &amp; João
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
