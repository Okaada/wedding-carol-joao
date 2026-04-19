"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  type: "anchor" | "route";
};

const links: NavLink[] = [
  { href: "#hero", label: "Início", type: "anchor" },
  { href: "#nossa-historia", label: "Nossa História", type: "anchor" },
  { href: "#galeria", label: "Galeria", type: "anchor" },
  { href: "/presentes", label: "Presentes", type: "route" },
  { href: "#rsvp", label: "Confirmar Presença", type: "anchor" },
];

function resolveHref(link: NavLink, pathname: string) {
  if (link.type === "anchor") {
    return pathname === "/" ? link.href : `/${link.href}`;
  }
  return link.href;
}

function isActive(link: NavLink, pathname: string) {
  if (link.type === "route") {
    return pathname === link.href;
  }
  return pathname === "/";
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  const brandHref = pathname === "/" ? "#hero" : "/#hero";

  return (
    <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href={brandHref}
          className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground"
        >
          C &amp; J
        </a>

        {/* Desktop links */}
        <ul className="hidden gap-8 md:flex">
          {links.map((link) => {
            const active = isActive(link, pathname);
            return (
              <li key={link.href}>
                <a
                  href={resolveHref(link, pathname)}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm tracking-widest uppercase transition-colors hover:text-primary ${
                    active ? "text-primary" : "text-muted"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Mobile menu button */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <ul className="flex flex-col items-center gap-6 bg-background py-6 md:hidden">
          {links.map((link) => {
            const active = isActive(link, pathname);
            return (
              <li key={link.href}>
                <a
                  href={resolveHref(link, pathname)}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm tracking-widest uppercase transition-colors hover:text-primary ${
                    active ? "text-primary" : "text-muted"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
