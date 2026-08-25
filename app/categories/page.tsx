"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { PageHeader } from "@/components/PageHeader";
import { CategoryForm } from "@/components/CategoryForm";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/States";
import type { Category, TransactionType } from "@/types";

/** Раздел «Категории»: просмотр, создание и правка своих категорий. */
export default function CategoriesPage() {
  const load = useCallback(() => api.categories.list(), []);
  const { data, loading, error, reload } = useAsyncData<Category[]>(load);

  const [editing, setEditing] = useState<Category | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = useMemo(() => data ?? [], [data]);
  const groups = useMemo(
    () => ({
      expense: categories.filter((category) => category.type === "expense"),
      income: categories.filter((category) => category.type === "income"),
    }),
    [categories]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(`Удалить категорию «${category.name}»?`);
    if (!confirmed) return;

    setBusyId(category.id);
    setActionError(null);

    try {
      await api.categories.remove(category.id);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Не удалось удалить категорию");
    } finally {
      setBusyId(null);
    }
  }

  function renderGroup(type: TransactionType, title: string, subtitle: string) {
    const items = groups[type];

    return (
      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        {items.length === 0 ? (
          <EmptyState icon="🏷️" title="Категорий нет" />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((category) => (
              <li
                key={category.id}
                className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${
                  busyId === category.id ? "opacity-50" : ""
                }`}
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-base"
                  style={{ backgroundColor: `${category.color}1a` }}
                  aria-hidden
                >
                  {category.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{category.name}</p>
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    {category.isDefault ? "Предустановленная" : "Своя категория"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === category.id}
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    Изменить
                  </Button>
                  {!category.isDefault ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === category.id}
                      onClick={() => handleDelete(category)}
                      className="hover:bg-expense-soft hover:text-expense"
                    >
                      Удалить
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Категории"
        subtitle="Предустановленные категории можно переименовать, свои — удалить"
        action={
          <Button variant="primary" onClick={openCreate}>
            <span aria-hidden>+</span> Категория
          </Button>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={reload} />
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      ) : null}

      {loading && categories.length === 0 ? (
        <Card>
          <Loading label="Загружаем категории…" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderGroup("expense", "Расходы", `${groups.expense.length} категорий`)}
          {renderGroup("income", "Доходы", `${groups.income.length} категорий`)}
        </div>
      )}

      {isFormOpen ? (
        <CategoryForm
          key={editing?.id ?? "new"}
          category={editing}
          onClose={() => setFormOpen(false)}
          onSaved={reload}
        />
      ) : null}
    </>
  );
}
