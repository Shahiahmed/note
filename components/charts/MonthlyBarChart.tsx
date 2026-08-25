"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EXPENSE_MARK, INCOME_MARK } from "@/lib/constants";
import { formatCompact, formatMonth, formatMoney } from "@/lib/format";
import type { MonthlyPoint } from "@/types";

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
  payload?: MonthlyPoint;
}

/** Подсказка при наведении: месяц, доход, расход и остаток. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const net = point.income - point.expense;

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm shadow-pop">
      <p className="mb-1.5 font-medium text-ink">{formatMonth(point.month)}</p>
      <dl className="tabular space-y-1">
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full" style={{ background: INCOME_MARK }} />
            Доход
          </dt>
          <dd className="font-medium text-ink">{formatMoney(point.income)}</dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full" style={{ background: EXPENSE_MARK }} />
            Расход
          </dt>
          <dd className="font-medium text-ink">{formatMoney(point.expense)}</dd>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-line pt-1">
          <dt className="text-muted">Остаток</dt>
          <dd className={`font-medium ${net < 0 ? "text-expense" : "text-income"}`}>
            {formatMoney(net)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Столбчатый график доходов и расходов по месяцам. */
export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  const hasValues = data.some((point) => point.income > 0 || point.expense > 0);

  return (
    <figure className="m-0">
      <div className="mb-4 flex flex-wrap items-center gap-4 px-1 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: INCOME_MARK }} aria-hidden />
          Доходы
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: EXPENSE_MARK }} aria-hidden />
          Расходы
        </span>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="#e7e9ee" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={62}
              tick={{ fill: "#78849b", fontSize: 12 }}
              tickFormatter={formatCompact}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "#0f172a", fillOpacity: 0.04 }}
            />
            <Bar dataKey="income" fill={INCOME_MARK} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="expense" fill={EXPENSE_MARK} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasValues ? (
        <figcaption className="mt-2 text-center text-sm text-faint">
          За выбранный период операций пока нет
        </figcaption>
      ) : null}
    </figure>
  );
}
