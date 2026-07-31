"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { href: "/method", label: "Method" },
  { href: "/methodology", label: "Methodology" },
  { href: "/applications", label: "Applications" },
  { href: "/evidence", label: "Evidence" },
  { href: "/calculator", label: "Calculator" },
];

const textItems = navItems.slice(0, 4);
const calculatorItem = navItems[4];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className="inline-block h-8 w-8" aria-hidden="true" />;
  }
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-border p-1.5 text-foreground hover:bg-muted transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

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
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-md border border-border px-2 py-1 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
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
