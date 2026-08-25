"use client";

import { formatDate, formatMoney } from "@/lib/format";
import type { Category, Transaction } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Map<string, Category>;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  /** id операции, которая сейчас удаляется — строка блокируется. */
  busyId?: string | null;
}

/** Список операций: категория, заметка, дата и сумма со знаком. */
export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  busyId,
}: TransactionListProps) {
  return (
    <ul className="divide-y divide-line">
      {transactions.map((transaction) => {
        const category = categories.get(transaction.categoryId);
        const isIncome = transaction.type === "income";
        const isBusy = busyId === transaction.id;

        return (
          <li
            key={transaction.id}
            className={`group flex items-center gap-3 px-4 py-3 transition-opacity sm:px-5 ${
              isBusy ? "opacity-50" : ""
            }`}
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl text-base"
              style={{ backgroundColor: `${category?.color ?? "#7c8a9c"}1a` }}
              aria-hidden
            >
              {category?.icon ?? "❔"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {category?.name ?? "Без категории"}
              </p>
              <p className="truncate text-[13px] text-muted">
                {formatDate(transaction.date)}
                {transaction.note ? ` · ${transaction.note}` : ""}
              </p>
            </div>

            <span
              className={`tabular shrink-0 text-sm font-semibold ${
                isIncome ? "text-income" : "text-expense"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatMoney(transaction.amount)}
            </span>

            {onEdit || onDelete ? (
              <div className="flex shrink-0 items-center gap-1">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    disabled={isBusy}
                    aria-label="Изменить операцию"
                    title="Изменить"
                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}

                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(transaction)}
                    disabled={isBusy}
                    aria-label="Удалить операцию"
                    title="Удалить"
                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-expense-soft hover:text-expense disabled:opacity-40"
                  >
                    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M4 6h12M8.5 6V4.5h3V6M6 6l.7 9.5h6.6L14 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
