import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Базовая карточка: белая подложка, тонкая рамка, мягкая тень. */
export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Шапка карточки с заголовком и необязательным действием справа. */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
