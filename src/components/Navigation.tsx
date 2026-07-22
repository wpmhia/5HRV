"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/method", label: "The 5-Min. Method" },
  { href: "/parameters", label: "HRV Parameters" },
  { href: "/interpretation", label: "Interpretation" },
  { href: "/applications", label: "Applications" },
  { href: "/calculator", label: "Calculator" },
  { href: "/evidence", label: "Evidence" },
  { href: "/about", label: "About" },
];

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          5HRV
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                path === item.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 text-sm text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-card px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    path === item.href
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
