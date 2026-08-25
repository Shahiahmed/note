"use client";

import { useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { formatMonth } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/States";
import type { BudgetProgress, Category } from "@/types";

interface BudgetFormProps {
  month: string;
  categories: Category[];
  /** Лимит для правки; null — создание нового. */
  budget: BudgetProgress | null;
  /** Категории, у которых лимит на этот месяц уже есть. */
  usedCategoryIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Модальная форма установки лимита расходов по категории.
 * Компонент монтируется только на время показа, поэтому начальные
 * значения берутся из props при монтировании.
 */
export function BudgetForm({
  month,
  categories,
  budget,
  usedCategoryIds,
  onClose,
  onSaved,
}: BudgetFormProps) {
  const [chosenId, setChosenId] = useState(budget?.categoryId ?? "");
  const [limit, setLimit] = useState(budget ? String(budget.limit) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Лимит ставится только на расходы; занятые категории не предлагаем заново.
  const available = useMemo(() => {
    const used = new Set(usedCategoryIds);
    return categories.filter(
      (category) =>
        category.type === "expense" &&
        (category.id === budget?.categoryId || !used.has(category.id))
    );
  }, [categories, usedCategoryIds, budget]);

  // Список категорий приходит асинхронно, поэтому выбор доводится
  // до допустимого значения во время отрисовки, а не эффектом.
  const categoryId = available.some((category) => category.id === chosenId)
    ? chosenId
    : (available[0]?.id ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const value = Number(limit.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Введите лимит больше нуля");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.budgets.set(categoryId, month, value);
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить лимит");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={budget ? "Изменить лимит" : "Новый лимит"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="rounded-xl bg-canvas px-3 py-2.5 text-sm text-muted">
          Лимит действует на {formatMonth(month)}
        </p>

        <Field label="Категория расходов" htmlFor="budget-category">
          <Select
            id="budget-category"
            value={categoryId}
            disabled={Boolean(budget)}
            onChange={(event) => setChosenId(event.target.value)}
            required
          >
            {available.length === 0 ? (
              <option value="">Лимиты заданы для всех категорий</option>
            ) : null}
            {available.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Лимит на месяц, ₸" htmlFor="budget-limit">
          <Input
            id="budget-limit"
            inputMode="numeric"
            autoComplete="off"
            placeholder="150 000"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            required
          />
        </Field>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={available.length === 0}
          >
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
