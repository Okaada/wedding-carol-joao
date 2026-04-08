"use client";

import { useActionState } from "react";
import { createAdminUser, type UserResult } from "@/app/actions/admin-users";
import { useRef, useEffect } from "react";

const initialState: UserResult = { success: false };

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createAdminUser, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

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
          minLength={6}
          className="w-full rounded-lg border border-accent bg-white px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">Administrador criado com sucesso!</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar administrador"}
      </button>
    </form>
  );
}
