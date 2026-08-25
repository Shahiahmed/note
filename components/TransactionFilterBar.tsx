"use client";

import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Category, TransactionFilters } from "@/types";

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  search: string;
  categories: Category[];
  onChange: (filters: TransactionFilters) => void;
  onSearchChange: (search: string) => void;
  onReset: () => void;
  /** Есть ли активные фильтры — от этого зависит кнопка сброса. */
  isDirty: boolean;
}

/** Панель фильтров списка операций: тип, категория, период и поиск. */
export function TransactionFilterBar({
  filters,
  search,
  categories,
  onChange,
  onSearchChange,
  onReset,
  isDirty,
}: TransactionFilterBarProps) {
  const visibleCategories =
    filters.type && filters.type !== "all"
      ? categories.filter((category) => category.type === filters.type)
      : categories;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Тип" htmlFor="filter-type">
          <Select
            id="filter-type"
            value={filters.type ?? "all"}
            onChange={(event) =>
              onChange({
                ...filters,
                type: event.target.value as TransactionFilters["type"],
                categoryId: undefined,
              })
            }
          >
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </Select>
        </Field>

        <Field label="Категория" htmlFor="filter-category">
          <Select
            id="filter-category"
            value={filters.categoryId ?? ""}
            onChange={(event) =>
              onChange({ ...filters, categoryId: event.target.value || undefined })
            }
          >
            <option value="">Все категории</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Дата с" htmlFor="filter-from">
          <Input
            id="filter-from"
            type="date"
            value={filters.from ?? ""}
            max={filters.to || undefined}
            onChange={(event) => onChange({ ...filters, from: event.target.value || undefined })}
          />
        </Field>

        <Field label="Дата по" htmlFor="filter-to">
          <Input
            id="filter-to"
            type="date"
            value={filters.to ?? ""}
            min={filters.from || undefined}
            onChange={(event) => onChange({ ...filters, to: event.target.value || undefined })}
          />
        </Field>

        <Field label="Поиск по заметкам" htmlFor="filter-search">
          <Input
            id="filter-search"
            type="search"
            autoComplete="off"
            placeholder="продукты, такси…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </Field>
      </div>

      {isDirty ? (
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="ghost" onClick={onReset}>
            Сбросить фильтры
          </Button>
        </div>
      ) : null}
    </div>
  );
}
