import { formatMoney, pluralDays } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/States";
import type { DailyBudget } from "@/types";

interface Props {
  budget: DailyBudget;
}

/**
 * Сколько можно тратить в день до конца месяца, сколько из этого уже
 * ушло сегодня и укладываетесь ли вы в темп.
 */
export function DailyBudgetCard({ budget }: Props) {
  const { available, perDay, daysLeft, spentToday, leftToday, averagePerDay } = budget;

  if (available <= 0) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-canvas text-sm" aria-hidden>
            📅
          </span>
          <div>
            <p className="text-[13px] font-medium text-muted">Можно тратить в день</p>
            <p className="mt-1 text-sm text-ink">Свободных денег нет</p>
            <p className="mt-1 text-xs text-faint">
              Баланс на нуле или в минусе — распределять до конца месяца нечего.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const percentToday = perDay > 0 ? (spentToday / perDay) * 100 : 0;
  const isOverToday = spentToday > perDay;
  const isOverPace = averagePerDay > perDay;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-accent-soft text-sm" aria-hidden>
              📅
            </span>
            <p className="text-[13px] font-medium text-muted">Можно тратить в день</p>
          </div>
          <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-accent sm:text-3xl">
            {formatMoney(perDay)}
          </p>
          <p className="mt-1 text-xs text-faint">
            {formatMoney(available)} на {daysLeft} {pluralDays(daysLeft)} до конца месяца
          </p>
        </div>

        <div className="w-full sm:max-w-[15rem]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-muted">Сегодня</span>
            <span className="tabular text-[13px] text-ink">{formatMoney(spentToday)}</span>
          </div>
          <div className="mt-2">
            <ProgressBar
              percent={percentToday}
              tone={isOverToday ? "exceeded" : percentToday >= 80 ? "warn" : "ok"}
              label="Расход за сегодня относительно дневной нормы"
            />
          </div>
          <p className={`mt-2 text-xs ${isOverToday ? "text-expense" : "text-faint"}`}>
            {isOverToday
              ? `Норма на сегодня превышена на ${formatMoney(spentToday - perDay)}`
              : `Сегодня можно ещё ${formatMoney(leftToday)}`}
          </p>
        </div>

        <div className="w-full sm:max-w-[13rem]">
          <p className="text-[13px] font-medium text-muted">Тратите в среднем</p>
          <p className="tabular mt-1 text-base font-semibold text-ink">
            {formatMoney(averagePerDay)} <span className="text-sm font-normal text-muted">в день</span>
          </p>
          <p className={`mt-1 text-xs ${isOverPace ? "text-warn" : "text-faint"}`}>
            {isOverPace
              ? "Быстрее нормы — до конца месяца не хватит"
              : "Темп укладывается в норму"}
          </p>
        </div>
      </div>
    </Card>
  );
}

/** Скелетон карточки на время загрузки. */
export function DailyBudgetCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-8 w-36" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
        <div className="w-full sm:max-w-[15rem]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-2 w-full" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
        <div className="w-full sm:max-w-[13rem]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-5 w-28" />
        </div>
      </div>
    </Card>
  );
}
