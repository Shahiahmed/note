"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { currentMonth, formatMoney, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { BudgetForm } from "@/components/BudgetForm";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/States";
import type { BudgetProgress, Category } from "@/types";

/** Раздел «Бюджеты»: лимиты расходов по категориям на выбранный месяц. */
export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<BudgetProgress | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadBudgets = useCallback(() => api.budgets.list(month), [month]);
  const loadCategories = useCallback(() => api.categories.list(), []);

  const budgetsState = useAsyncData<BudgetProgress[]>(loadBudgets);
  const categoriesState = useAsyncData<Category[]>(loadCategories);

  const budgets = useMemo(() => budgetsState.data ?? [], [budgetsState.data]);
  const categories = useMemo(() => categoriesState.data ?? [], [categoriesState.data]);

  const totals = useMemo(() => {
    const limit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
    const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    return { limit, spent, percent: limit > 0 ? (spent / limit) * 100 : 0 };
  }, [budgets]);

  const usedCategoryIds = budgets.map((budget) => budget.categoryId);

  async function handleDelete(budget: BudgetProgress) {
    const name = budget.category?.name ?? "категории";
    if (!window.confirm(`Снять лимит для «${name}»?`)) return;

    setBusyId(budget.categoryId);
    setActionError(null);

    try {
      await api.budgets.remove(budget.categoryId, month);
      budgetsState.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Не удалось снять лимит");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Бюджеты"
        subtitle="Лимиты расходов по категориям и прогресс по ним"
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <span aria-hidden>+</span> Лимит
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="budget-month" className="text-[13px] font-medium text-muted">
            Месяц
          </label>
          <Input
            id="budget-month"
            type="month"
            className="w-48"
            value={month}
            onChange={(event) => setMonth(event.target.value || currentMonth())}
          />
        </div>

        {budgets.length > 0 ? (
          <div className="min-w-56 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">Всего по лимитам</span>
              <span className="tabular font-medium text-ink">
                {formatMoney(totals.spent)} из {formatMoney(totals.limit)}
              </span>
            </div>
            <ProgressBar
              percent={totals.percent}
              tone={totals.spent > totals.limit ? "exceeded" : totals.percent >= 80 ? "warn" : "ok"}
              label="Общий прогресс по лимитам"
            />
          </div>
        ) : null}
      </div>

      {actionError ? (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      ) : null}

      {categoriesState.error ? (
        <div className="mb-4">
          <ErrorBanner message={categoriesState.error} onRetry={categoriesState.reload} />
        </div>
      ) : null}

      <Card>
        <CardHeader title="Лимиты по категориям" subtitle={`Установлено лимитов: ${budgets.length}`} />

        {budgetsState.error ? (
          <div className="p-4 sm:p-5">
            <ErrorBanner message={budgetsState.error} onRetry={budgetsState.reload} />
          </div>
        ) : budgetsState.loading ? (
          <Loading label="Загружаем лимиты…" />
        ) : budgets.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="Лимитов на этот месяц нет"
            description="Задайте лимит на категорию расходов — приложение покажет, сколько уже потрачено."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Задать лимит
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {budgets.map((budget) => {
              const tone = budget.isExceeded ? "exceeded" : budget.isWarning ? "warn" : "ok";
              const isBusy = busyId === budget.categoryId;

              return (
                <li
                  key={budget.categoryId}
                  className={`px-4 py-4 sm:px-5 ${isBusy ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-base"
                      style={{ backgroundColor: `${budget.category?.color ?? "#7c8a9c"}1a` }}
                      aria-hidden
                    >
                      {budget.category?.icon ?? "❔"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {budget.category?.name ?? "Удалённая категория"}
                      </p>
                      <p className="tabular text-[13px] text-muted">
                        {formatMoney(budget.spent)} из {formatMoney(budget.limit)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => {
                          setEditing(budget);
                          setFormOpen(true);
                        }}
                      >
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleDelete(budget)}
                        className="hover:bg-expense-soft hover:text-expense"
                      >
                        Снять
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar
                      percent={budget.percent}
                      tone={tone}
                      label={`Лимит «${budget.category?.name ?? ""}»`}
                    />
                    <p className="tabular mt-1.5 text-[13px]">
                      {budget.isExceeded ? (
                        <span className="font-medium text-expense">
                          ⚠️ Превышение на {formatMoney(Math.abs(budget.remaining))} (
                          {formatNumber(Math.round(budget.percent))}%)
                        </span>
                      ) : budget.isWarning ? (
                        <span className="font-medium text-warn">
                          Осталось {formatMoney(budget.remaining)} ·{" "}
                          {formatNumber(Math.round(budget.percent))}% лимита израсходовано
                        </span>
                      ) : (
                        <span className="text-muted">
                          Осталось {formatMoney(budget.remaining)} ·{" "}
                          {formatNumber(Math.round(budget.percent))}% лимита израсходовано
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {isFormOpen ? (
        <BudgetForm
          key={editing?.categoryId ?? "new"}
          month={month}
          categories={categories}
          budget={editing}
          usedCategoryIds={usedCategoryIds}
          onClose={() => setFormOpen(false)}
          onSaved={budgetsState.reload}
        />
      ) : null}
    </>
  );
}
