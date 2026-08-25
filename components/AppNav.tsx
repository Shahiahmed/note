"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Дашборд", icon: "📊" },
  { href: "/transactions", label: "Операции", icon: "🧾" },
  { href: "/categories", label: "Категории", icon: "🏷️" },
  { href: "/budgets", label: "Бюджеты", icon: "🎯" },
] as const;

/** Шапка приложения с навигацией по разделам. */
export function AppNav() {
  const pathname = usePathname();

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
      </div>
    </header>
  );
}
