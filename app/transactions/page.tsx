"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAsyncData } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { TransactionFilterBar } from "@/components/TransactionFilterBar";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/States";
import type { Category, Transaction, TransactionFilters } from "@/types";

const EMPTY_FILTERS: TransactionFilters = { type: "all" };

/** Раздел «Операции»: фильтры, поиск, добавление и редактирование. */
export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Поиск отправляется на сервер не на каждое нажатие клавиши.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { type, categoryId, from, to } = filters;

  const loadTransactions = useCallback(
    () => api.transactions.list({ type, categoryId, from, to, search: debouncedSearch }),
    [type, categoryId, from, to, debouncedSearch]
  );
  const loadCategories = useCallback(() => api.categories.list(), []);

  const transactionsState = useAsyncData(loadTransactions);
  const categoriesState = useAsyncData<Category[]>(loadCategories);

  const transactions = useMemo(() => transactionsState.data ?? [], [transactionsState.data]);
  const categories = useMemo(() => categoriesState.data ?? [], [categoriesState.data]);
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const transaction of transactions) {
      if (transaction.type === "income") income += transaction.amount;
      else expense += transaction.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const isDirty =
    (filters.type ?? "all") !== "all" ||
    Boolean(filters.categoryId || filters.from || filters.to || search);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setFormOpen(true);
  }

  async function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(
      `Удалить операцию на ${formatMoney(transaction.amount)}? Действие необратимо.`
    );
    if (!confirmed) return;

    setDeletingId(transaction.id);
    setActionError(null);

    try {
      await api.transactions.remove(transaction.id);
      transactionsState.reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Не удалось удалить операцию");
    } finally {
      setDeletingId(null);
    }
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  }

  return (
    <>
      <PageHeader
        title="Операции"
        subtitle="Все доходы и расходы с фильтрами и поиском"
        action={
          <Button variant="primary" onClick={openCreate}>
            <span aria-hidden>+</span> Операция
          </Button>
        }
      />

      <TransactionFilterBar
        filters={filters}
        search={search}
        categories={categories}
        onChange={setFilters}
        onSearchChange={setSearch}
        onReset={handleReset}
        isDirty={isDirty}
      />

      {categoriesState.error ? (
        <div className="mt-4">
          <ErrorBanner message={categoriesState.error} onRetry={categoriesState.reload} />
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4">
          <ErrorBanner message={actionError} />
        </div>
      ) : null}

      <div className="mt-4">
        <Card>
          <CardHeader
            title={`Найдено операций: ${transactions.length}`}
            subtitle={
              transactions.length > 0
                ? `Доходы ${formatMoney(totals.income)} · Расходы ${formatMoney(
                    totals.expense
                  )} · Итог ${formatMoney(totals.net)}`
                : undefined
            }
          />

          {transactionsState.error ? (
            <div className="p-4 sm:p-5">
              <ErrorBanner message={transactionsState.error} onRetry={transactionsState.reload} />
            </div>
          ) : transactionsState.loading ? (
            <Loading />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={isDirty ? "🔍" : "🧾"}
              title={isDirty ? "Ничего не найдено" : "Операций пока нет"}
              description={
                isDirty
                  ? "Попробуйте изменить фильтры или очистить поиск."
                  : "Добавьте первую операцию — она сразу появится в списке и на дашборде."
              }
              action={
                isDirty ? (
                  <Button onClick={handleReset}>Сбросить фильтры</Button>
                ) : (
                  <Button variant="primary" onClick={openCreate}>
                    Добавить операцию
                  </Button>
                )
              }
            />
          ) : (
            <TransactionList
              transactions={transactions}
              categories={categoryMap}
              onEdit={openEdit}
              onDelete={handleDelete}
              busyId={deletingId}
            />
          )}
        </Card>
      </div>

      {isFormOpen ? (
        <TransactionForm
          key={editing?.id ?? "new"}
          transaction={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={transactionsState.reload}
        />
      ) : null}
    </>
  );
}
