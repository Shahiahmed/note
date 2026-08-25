"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { OTHER_SLICE_COLOR, PIE_SLICE_LIMIT } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/format";
import type { CategoryPoint } from "@/types";

interface Slice {
  name: string;
  icon: string;
  color: string;
  amount: number;
  share: number;
}

/**
 * Оставляет крупнейшие категории, а остальные сворачивает в «Другое»,
 * чтобы диаграмма не рассыпалась на неразличимые дольки.
 */
function buildSlices(data: CategoryPoint[]): { slices: Slice[]; total: number } {
  const total = data.reduce((sum, point) => sum + point.amount, 0);
  if (total === 0) return { slices: [], total: 0 };

  const top = data.slice(0, PIE_SLICE_LIMIT);
  const rest = data.slice(PIE_SLICE_LIMIT);

  const slices: Slice[] = top.map((point) => ({
    name: point.name,
    icon: point.icon,
    color: point.color,
    amount: point.amount,
    share: (point.amount / total) * 100,
  }));

  if (rest.length > 0) {
    const amount = rest.reduce((sum, point) => sum + point.amount, 0);
    slices.push({
      name: `Другое (${rest.length})`,
      icon: "➕",
      color: OTHER_SLICE_COLOR,
      amount,
      share: (amount / total) * 100,
    });
  }

  return { slices, total };
}

function SliceTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Slice }[] }) {
  const slice = active ? payload?.[0]?.payload : undefined;
  if (!slice) return null;

  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-pop">
      <p className="flex items-center gap-1.5 font-medium text-ink">
        <span className="size-2.5 rounded-sm" style={{ background: slice.color }} aria-hidden />
        {slice.name}
      </p>
      <p className="tabular mt-1 text-muted">
        {formatMoney(slice.amount)} · {formatNumber(Math.round(slice.share))}%
      </p>
    </div>
  );
}

/**
 * Круговая диаграмма расходов по категориям.
 * Рядом всегда идёт список с суммами — он же служит текстовой
 * альтернативой цвету и делает диаграмму читаемой без различения оттенков.
 */
export function CategoryPieChart({ data }: { data: CategoryPoint[] }) {
  const { slices, total } = useMemo(() => buildSlices(data), [data]);

  if (slices.length === 0) {
    return (
      <p className="px-1 py-10 text-center text-sm text-faint">
        В этом месяце расходов ещё не было
      </p>
    );
  }

  return (
    <figure className="m-0 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-wide text-faint">Всего</span>
          <span className="tabular text-sm font-semibold text-ink">{formatMoney(total)}</span>
        </div>
      </div>

      <figcaption className="w-full min-w-0">
        <ul className="flex w-full flex-col gap-2">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: slice.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-muted">
                {slice.icon} {slice.name}
              </span>
              <span className="tabular shrink-0 font-medium text-ink">
                {formatMoney(slice.amount)}
              </span>
              <span className="tabular w-11 shrink-0 text-right text-faint">
                {formatNumber(Math.round(slice.share))}%
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
