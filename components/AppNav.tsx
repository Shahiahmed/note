"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "Дашборд", short: "Главная", icon: "📊" },
  { href: "/transactions", label: "Операции", short: "Операции", icon: "🧾" },
  { href: "/categories", label: "Категории", short: "Категории", icon: "🏷️" },
  { href: "/budgets", label: "Бюджеты", short: "Бюджеты", icon: "🎯" },
] as const;

function isLinkActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Навигация приложения.
 *
 * На широком экране — обычная шапка со ссылками. На телефоне ссылки
 * переезжают в нижнюю панель: до неё дотягивается большой палец,
 * а сверху остаётся только название и выход.
 */
export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLeaving, setLeaving] = useState(false);

  // На странице входа навигация не нужна.
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
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-base text-white">
              ₸
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">Мой бюджет</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* На телефоне эти ссылки живут в нижней панели. */}
            <nav aria-label="Разделы" className="hidden sm:block">
              <ul className="flex items-center gap-1">
                {LINKS.map((link) => {
                  const isActive = isLinkActive(link.href, pathname);

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

      <nav
        aria-label="Разделы"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {LINKS.map((link) => {
            const isActive = isLinkActive(link.href, pathname);

            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors ${
                    isActive ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {link.icon}
                  </span>
                  {link.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
