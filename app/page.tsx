"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { formatMonth } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, StatCardSkeleton } from "@/components/StatCard";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/States";
import type { Category, DashboardStats } from "@/types";

/** Главная страница: показатели месяца, графики и последние операции. */
export default function DashboardPage() {
  const load = useCallback(
    (): Promise<[DashboardStats, Category[]]> =>
      Promise.all([api.stats(), api.categories.list()]),
    []
  );

  const { data, loading, error, reload } = useAsyncData(load);
  const [isFormOpen, setFormOpen] = useState(false);

  const stats = data?.[0] ?? null;
  const categories = data?.[1] ?? [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle={stats ? formatMonth(stats.month) : "Личный учёт доходов и расходов"}
        action={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <span aria-hidden>+</span> Операция
          </Button>
        }
      />

      {error ? (
        <div className="mb-5">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Общий баланс"
              value={stats?.balance ?? 0}
              icon="💰"
              tone={(stats?.balance ?? 0) < 0 ? "expense" : "accent"}
              hint="За всё время"
            />
            <StatCard
              label="Доход за месяц"
              value={stats?.monthIncome ?? 0}
              icon="📈"
              tone="income"
            />
            <StatCard
              label="Расход за месяц"
              value={stats?.monthExpense ?? 0}
              icon="📉"
              tone="expense"
            />
            <StatCard
              label="Остаток за месяц"
              value={stats?.monthNet ?? 0}
              icon="🧮"
              tone={(stats?.monthNet ?? 0) < 0 ? "expense" : "income"}
              signed
              hint="Доходы минус расходы"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Доходы и расходы" subtitle="Последние 6 месяцев" />
          <div className="px-4 py-5 sm:px-5">
            {loading && !stats ? (
              <Loading />
            ) : (
              <MonthlyBarChart data={stats?.monthly ?? []} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Расходы по категориям"
            subtitle={stats ? formatMonth(stats.month) : undefined}
          />
          <div className="px-4 py-5 sm:px-5">
            {loading && !stats ? (
              <Loading />
            ) : (
              <CategoryPieChart data={stats?.byCategory ?? []} />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader
            title="Последние операции"
            action={
              <Link
                href="/transactions"
                className="text-sm font-medium text-accent hover:underline"
              >
                Все операции
              </Link>
            }
          />
          {loading && !stats ? (
            <Loading />
          ) : stats && stats.recent.length > 0 ? (
            <TransactionList transactions={stats.recent} categories={categoryMap} />
          ) : (
            <EmptyState
              icon="🪙"
              title="Операций пока нет"
              description="Добавьте первый доход или расход, чтобы увидеть статистику."
              action={
                <Button variant="primary" onClick={() => setFormOpen(true)}>
                  Добавить операцию
                </Button>
              }
            />
          )}
        </Card>
      </div>

      {isFormOpen ? (
        <TransactionForm
          transaction={null}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
