import type { TransactionInput, CategoryInput } from "@/types";
import { getCategory, isTransactionType } from "@/lib/redis";

/** Ошибка входных данных — уходит пользователю как 400. */
export class ValidationError extends Error {}

/** Запрошенная сущность не найдена — 404. */
export class NotFoundError extends Error {}

/** Ответ с ошибкой в едином формате `{ error }`. */
export function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Единая обёртка для обработчиков маршрутов.
 * Результат сериализуется в JSON, известные ошибки превращаются
 * в 400/404, остальные — в 500 с записью в лог.
 */
export async function route<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    return Response.json(await fn());
  } catch (error) {
    if (error instanceof ValidationError) return fail(error.message, 400);
    if (error instanceof NotFoundError) return fail(error.message, 404);

    console.error("[api]", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка на сервере";
    return fail(message, 500);
  }
}

/** Читает JSON-тело запроса, отдавая понятную ошибку на битом JSON. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Тело запроса не является корректным JSON");
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Ожидался объект с данными");
  }
  return body as Record<string, unknown>;
}

/** Проверяет и нормализует тело запроса на создание/изменение операции. */
export function parseTransactionInput(body: unknown): TransactionInput {
  const data = asRecord(body);

  if (!isTransactionType(data.type)) {
    throw new ValidationError("Тип операции должен быть income или expense");
  }

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("Сумма должна быть положительным числом");
  }

  const categoryId = String(data.categoryId ?? "").trim();
  if (!categoryId) {
    throw new ValidationError("Не выбрана категория");
  }

  const date = String(data.date ?? "").trim();
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new ValidationError("Дата должна быть в формате ГГГГ-ММ-ДД");
  }

  const note = String(data.note ?? "").trim().slice(0, 500);

  return { type: data.type, amount: Math.round(amount * 100) / 100, categoryId, date, note };
}

/**
 * Проверяет, что категория операции существует и совпадает по типу:
 * доход нельзя записать в расходную категорию и наоборот.
 */
export async function assertCategoryFits(input: TransactionInput): Promise<void> {
  const category = await getCategory(input.categoryId);

  if (!category) {
    throw new ValidationError("Выбранной категории не существует");
  }
  if (category.type !== input.type) {
    const expected = category.type === "income" ? "доходов" : "расходов";
    throw new ValidationError(`Категория «${category.name}» предназначена для ${expected}`);
  }
}

/** Проверяет и нормализует тело запроса на создание/изменение категории. */
export function parseCategoryInput(body: unknown): CategoryInput {
  const data = asRecord(body);

  const name = String(data.name ?? "").trim().slice(0, 60);
  if (!name) {
    throw new ValidationError("Введите название категории");
  }

  if (!isTransactionType(data.type)) {
    throw new ValidationError("Тип категории должен быть income или expense");
  }

  const color = String(data.color ?? "").trim();
  if (!COLOR_RE.test(color)) {
    throw new ValidationError("Цвет должен быть в формате #RRGGBB");
  }

  const icon = String(data.icon ?? "").trim().slice(0, 8) || "💸";

  return { name, type: data.type, color, icon };
}

/** Проверяет месяц в формате ГГГГ-ММ. */
export function parseMonth(value: unknown): string {
  const month = String(value ?? "").trim();
  if (!MONTH_RE.test(month)) {
    throw new ValidationError("Месяц должен быть в формате ГГГГ-ММ");
  }
  return month;
}

/** Проверяет неотрицательный лимит бюджета. */
export function parseLimit(value: unknown): number {
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new ValidationError("Лимит должен быть положительным числом");
  }
  return Math.round(limit);
}
