"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { href: "/method", label: "Method" },
  { href: "/applications", label: "Clinical Use" },
  { href: "/evidence", label: "Evidence" },
  { href: "/calculator", label: "Calculator" },
];

const textItems = navItems.slice(0, 3);
const calculatorItem = navItems[3];

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          5HRV
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {textItems.map((item) => (
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
          <Button variant="outline" size="sm" asChild>
            <Link href={calculatorItem.href}>{calculatorItem.label}</Link>
          </Button>
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
                {item.href === "/calculator" ? (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  </Button>
                ) : (
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
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
