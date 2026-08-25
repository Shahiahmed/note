"use client";

import { useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { todayISO } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/States";
import type { Category, Transaction, TransactionType } from "@/types";

interface TransactionFormProps {
  /** Операция для редактирования; null — создание новой. */
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  type: TransactionType;
  amount: string;
  categoryId: string;
  date: string;
  note: string;
}

function initialState(transaction: Transaction | null): FormState {
  if (transaction) {
    return {
      type: transaction.type,
      amount: String(transaction.amount),
      categoryId: transaction.categoryId,
      date: transaction.date,
      note: transaction.note,
    };
  }
  return { type: "expense", amount: "", categoryId: "", date: todayISO(), note: "" };
}

/**
 * Модальная форма добавления и редактирования операции.
 * Компонент монтируется только на время показа — поля заполняются
 * из props при монтировании, поэтому сбрасывать их эффектом не нужно.
 */
export function TransactionForm({
  transaction,
  categories,
  onClose,
  onSaved,
}: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(transaction));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  // При смене типа операции выбранная категория может стать недоступной —
  // тогда подставляем первую подходящую прямо во время отрисовки.
  const categoryId = available.some((category) => category.id === form.categoryId)
    ? form.categoryId
    : (available[0]?.id ?? "");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const amount = Number(form.amount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Введите сумму больше нуля");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }

    setSaving(true);
    setError(null);

    const input = {
      type: form.type,
      amount,
      categoryId,
      date: form.date,
      note: form.note.trim(),
    };

    try {
      if (transaction) {
        await api.transactions.update(transaction.id, input);
      } else {
        await api.transactions.create(input);
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить операцию");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={transaction ? "Изменить операцию" : "Новая операция"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          role="group"
          aria-label="Тип операции"
          className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1"
        >
          {(["expense", "income"] as const).map((type) => {
            const isActive = form.type === type;
            const activeClass =
              type === "income"
                ? "bg-surface text-income shadow-sm"
                : "bg-surface text-expense shadow-sm";

            return (
              <button
                key={type}
                type="button"
                aria-pressed={isActive}
                onClick={() => update("type", type)}
                className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? activeClass : "text-muted hover:text-ink"
                }`}
              >
                {type === "income" ? "Доход" : "Расход"}
              </button>
            );
          })}
        </div>

        <Field label="Сумма, ₸" htmlFor="amount">
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="15 000"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
            required
          />
        </Field>

        <Field label="Категория" htmlFor="category">
          <Select
            id="category"
            name="category"
            value={categoryId}
            onChange={(event) => update("categoryId", event.target.value)}
            required
          >
            {available.length === 0 ? <option value="">Нет категорий</option> : null}
            {available.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Дата" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={(event) => update("date", event.target.value)}
            required
          />
        </Field>

        <Field label="Заметка" htmlFor="note" hint="Необязательно — по заметкам работает поиск">
          <Input
            id="note"
            name="note"
            maxLength={500}
            autoComplete="off"
            placeholder="Например: продукты на неделю"
            value={form.note}
            onChange={(event) => update("note", event.target.value)}
          />
        </Field>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {transaction ? "Сохранить" : "Добавить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
