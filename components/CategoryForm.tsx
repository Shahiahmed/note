"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { COLOR_PALETTE, ICON_PALETTE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/States";
import type { Category, TransactionType } from "@/types";

interface CategoryFormProps {
  /** Категория для редактирования; null — создание новой. */
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

function initialState(category: Category | null): FormState {
  if (category) {
    return { name: category.name, type: category.type, icon: category.icon, color: category.color };
  }
  return { name: "", type: "expense", icon: ICON_PALETTE[0], color: COLOR_PALETTE[0] };
}

/**
 * Модальная форма создания и редактирования категории.
 * Компонент монтируется только на время показа, поэтому поля
 * заполняются из props при монтировании.
 */
export function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(category));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Введите название категории");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input = { ...form, name: form.name.trim() };
      if (category) {
        await api.categories.update(category.id, input);
      } else {
        await api.categories.create(input);
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={category ? "Изменить категорию" : "Новая категория"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl text-lg"
            style={{ backgroundColor: `${form.color}22` }}
            aria-hidden
          >
            {form.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {form.name.trim() || "Название категории"}
            </p>
            <p className="text-[13px] text-muted">
              {form.type === "income" ? "Доход" : "Расход"}
            </p>
          </div>
        </div>

        <Field label="Название" htmlFor="category-name">
          <Input
            id="category-name"
            maxLength={60}
            autoComplete="off"
            placeholder="Например: Кафе"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </Field>

        <div
          role="group"
          aria-label="Тип категории"
          className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1"
        >
          {(["expense", "income"] as const).map((type) => {
            const isActive = form.type === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={isActive}
                disabled={Boolean(category)}
                onClick={() => update("type", type)}
                className={`h-9 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? type === "income"
                      ? "bg-surface text-income shadow-sm"
                      : "bg-surface text-expense shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {type === "income" ? "Доход" : "Расход"}
              </button>
            );
          })}
        </div>

        <Field label="Иконка">
          <div className="grid grid-cols-10 gap-1">
            {ICON_PALETTE.map((icon) => (
              <button
                key={icon}
                type="button"
                aria-label={`Иконка ${icon}`}
                aria-pressed={form.icon === icon}
                onClick={() => update("icon", icon)}
                className={`grid aspect-square place-items-center rounded-lg text-base transition-colors ${
                  form.icon === icon ? "bg-accent-soft ring-2 ring-accent" : "hover:bg-canvas"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Цвет">
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Цвет ${color}`}
                aria-pressed={form.color === color}
                onClick={() => update("color", color)}
                style={{ backgroundColor: color }}
                className={`size-7 rounded-lg transition-transform ${
                  form.color === color
                    ? "ring-2 ring-ink ring-offset-2"
                    : "hover:scale-110"
                }`}
              />
            ))}
          </div>
        </Field>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {category ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
