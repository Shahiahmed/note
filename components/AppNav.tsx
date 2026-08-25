"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Дашборд", icon: "📊" },
  { href: "/transactions", label: "Операции", icon: "🧾" },
  { href: "/categories", label: "Категории", icon: "🏷️" },
  { href: "/budgets", label: "Бюджеты", icon: "🎯" },
] as const;

/** Шапка приложения с навигацией по разделам. */
export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLeaving, setLeaving] = useState(false);

  // На странице входа шапка не нужна.
  if (pathname === "/login") return null;

  async function handleLogout() {
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-base text-white">
            ₸
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Мой бюджет
          </span>
        </Link>

        <div className="flex items-center gap-2">
        <nav aria-label="Разделы" className="-mx-1 overflow-x-auto">
          <ul className="flex items-center gap-1 px-1">
            {LINKS.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    <span aria-hidden>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLeaving}
          title="Выйти"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
        >
          <span aria-hidden>🚪</span>
          <span className="sr-only sm:not-sr-only">Выйти</span>
        </button>
        </div>
      </div>
    </header>
  );
}
