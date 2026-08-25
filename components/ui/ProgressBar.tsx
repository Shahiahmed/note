type Tone = "ok" | "warn" | "exceeded";

const FILL: Record<Tone, string> = {
  ok: "bg-accent",
  warn: "bg-warn",
  exceeded: "bg-expense-mark",
};

interface ProgressBarProps {
  /** Доля израсходованного, в процентах; значения выше 100 обрезаются. */
  percent: number;
  tone?: Tone;
  label?: string;
}

/** Полоса прогресса расходования лимита. */
export function ProgressBar({ percent, tone = "ok", label }: ProgressBarProps) {
  const width = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-line"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${FILL[tone]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
