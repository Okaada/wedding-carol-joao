"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/rsvp", label: "Confirmações" },
  { href: "/admin/gifts", label: "Presentes" },
  { href: "/admin/settings", label: "Configurações" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-accent bg-section-alt">
      <div className="border-b border-accent px-5 py-5">
        <Link href="/admin" className="font-[family-name:var(--font-playfair)] text-lg font-bold text-foreground">
          C &amp; J Admin
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-accent/50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-accent px-3 py-4">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          Sair
        </button>
        <Link
          href="/"
          className="mt-1 block rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          Ver site
        </Link>
      </div>
    </aside>
  );
}
