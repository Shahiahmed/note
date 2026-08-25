import type { ReactNode } from "react";

/** Крутящийся индикатор загрузки. */
export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={`inline-block animate-spin rounded-full border-2 border-line border-t-accent ${className}`}
    />
  );
}

/** Заглушка на время загрузки блока. */
export function Loading({ label = "Загружаем данные…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

/** Серый прямоугольник-заполнитель для скелетонов. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/70 ${className}`} />;
}

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

/** Сообщение об ошибке с кнопкой повтора. */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-expense-soft px-4 py-3 text-sm text-expense"
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-200 bg-surface px-3 py-1 font-medium transition-colors hover:bg-red-50"
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Пустое состояние списка: иконка, объяснение и призыв к действию. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
