import { formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/States";

type Tone = "neutral" | "income" | "expense" | "accent";

const TONES: Record<Tone, { value: string; chip: string }> = {
  neutral: { value: "text-ink", chip: "bg-canvas text-muted" },
  income: { value: "text-income", chip: "bg-income-soft text-income" },
  expense: { value: "text-expense", chip: "bg-expense-soft text-expense" },
  accent: { value: "text-accent", chip: "bg-accent-soft text-accent" },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  tone?: Tone;
  hint?: string;
  /** Показывать знак «+» у положительных значений. */
  signed?: boolean;
}

/** Карточка ключевого показателя на дашборде. */
export function StatCard({ label, value, icon, tone = "neutral", hint, signed }: StatCardProps) {
  const palette = TONES[tone];
  const prefix = signed && value > 0 ? "+" : "";

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={`grid size-8 place-items-center rounded-xl text-sm ${palette.chip}`} aria-hidden>
          {icon}
        </span>
      </div>
      <p className={`tabular mt-3 text-xl font-semibold tracking-tight sm:text-2xl ${palette.value}`}>
        {prefix}
        {formatMoney(value)}
      </p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

/** Скелетон карточки показателя на время загрузки. */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8" />
      </div>
      <Skeleton className="mt-3 h-7 w-32" />
    </div>
  );
}
