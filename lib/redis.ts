import { Redis } from "@upstash/redis";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { currentMonth, formatMonthShort, lastMonths, monthRange } from "@/lib/format";
import type {
  Budget,
  BudgetProgress,
  Category,
  CategoryInput,
  CategoryPoint,
  DashboardStats,
  MonthlyPoint,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionType,
} from "@/types";

/**
 * Необязательный префикс всех ключей.
 * Нужен, чтобы приложение могло делить одну базу Upstash с другими
 * проектами: задайте REDIS_KEY_PREFIX=budget: — и ключи не пересекутся.
 */
const PREFIX = process.env.REDIS_KEY_PREFIX ?? "";

/** Ключи, по которым данные лежат в Redis. */
export const KEYS = {
  /** Хеш с полями одной операции. */
  transaction: (id: string) => `${PREFIX}transactions:${id}`,
  /** Отсортированное множество id операций, score — timestamp даты. */
  timeline: `${PREFIX}user:transactions`,
  /** Хеш всех категорий: id → JSON категории. */
  categories: `${PREFIX}categories`,
  /** Хеш лимитов одной категории: месяц (YYYY-MM) → лимит. */
  budget: (categoryId: string) => `${PREFIX}budgets:${categoryId}`,
  /** Множество категорий, для которых заданы лимиты. */
  budgetIndex: `${PREFIX}budgets:index`,
  /** Флаг, что предустановленные категории уже добавлены. */
  seedFlag: `${PREFIX}seed:categories`,
} as const;

let client: Redis | null = null;

/**
 * Возвращает singleton-клиент Upstash Redis.
 * Бросает понятную ошибку, если переменные окружения не заданы.
 */
export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Не заданы UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN. " +
        "Скопируйте .env.example в .env.local и укажите данные вашей базы Upstash."
    );
  }

  client = new Redis({ url, token });
  return client;
}

/* ------------------------------------------------------------------ */
/* Вспомогательные преобразования                                      */
/* ------------------------------------------------------------------ */

/**
 * Приводит значение из Redis к строке.
 * Upstash сам пытается разобрать значения через JSON.parse, поэтому
 * заметка вида `{"a":1}` вернётся объектом — собираем её обратно.
 */
function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(toText(value));
  return Number.isFinite(n) ? n : 0;
}

function safeJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** Timestamp полуночи UTC для даты YYYY-MM-DD — используется как score. */
function dateScore(date: string): number {
  const ts = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(ts) ? 0 : ts;
}

function parseTransaction(raw: Record<string, unknown> | null): Transaction | null {
  if (!raw || !raw.id) return null;
  return {
    id: toText(raw.id),
    type: toText(raw.type) === "income" ? "income" : "expense",
    amount: toNumber(raw.amount),
    categoryId: toText(raw.categoryId),
    date: toText(raw.date),
    note: toText(raw.note),
    createdAt: toNumber(raw.createdAt),
  };
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Категории                                                           */
/* ------------------------------------------------------------------ */

/** Один раз наполняет базу предустановленными категориями. */
async function ensureSeeded(): Promise<void> {
  const redis = getRedis();
  const isFirstRun = await redis.setnx(KEYS.seedFlag, 1);
  if (!isFirstRun) return;

  const payload: Record<string, string> = {};
  for (const category of DEFAULT_CATEGORIES) {
    payload[category.id] = JSON.stringify(category);
  }
  await redis.hset(KEYS.categories, payload);
}

/** Все категории: сначала расходные, внутри группы — по алфавиту. */
export async function getCategories(): Promise<Category[]> {
  await ensureSeeded();
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, Category | string>>(KEYS.categories);
  if (!raw) return [];

  const categories = Object.values(raw)
    .map((value): Category | null => {
      const parsed = typeof value === "string" ? safeJson<Category>(value) : value;
      return parsed && parsed.id ? parsed : null;
    })
    .filter((c): c is Category => c !== null);

  return categories.sort((a, b) => {
    if (a.type !== b.type) return a.type === "expense" ? -1 : 1;
    return a.name.localeCompare(b.name, "ru");
  });
}

/** Словарь категорий по id — удобен для связывания в статистике. */
export async function getCategoryMap(): Promise<Map<string, Category>> {
  const categories = await getCategories();
  return new Map(categories.map((c) => [c.id, c]));
}

export async function getCategory(id: string): Promise<Category | null> {
  const redis = getRedis();
  const raw = await redis.hget<Category | string>(KEYS.categories, id);
  if (!raw) return null;
  return typeof raw === "string" ? safeJson<Category>(raw) : raw;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const redis = getRedis();
  const category: Category = { id: newId(), ...input, isDefault: false };
  await redis.hset(KEYS.categories, { [category.id]: JSON.stringify(category) });
  return category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category | null> {
  const existing = await getCategory(id);
  if (!existing) return null;

  const redis = getRedis();
  const updated: Category = { ...existing, ...input };
  await redis.hset(KEYS.categories, { [id]: JSON.stringify(updated) });
  return updated;
}

/** Число операций, ссылающихся на категорию. */
export async function countTransactionsInCategory(categoryId: string): Promise<number> {
  const transactions = await listTransactions({ categoryId });
  return transactions.length;
}

export async function deleteCategory(id: string): Promise<void> {
  const redis = getRedis();
  await Promise.all([
    redis.hdel(KEYS.categories, id),
    redis.del(KEYS.budget(id)),
    redis.srem(KEYS.budgetIndex, id),
  ]);
}

/* ------------------------------------------------------------------ */
/* Операции                                                            */
/* ------------------------------------------------------------------ */

/** Загружает операции по списку id одним pipeline-запросом. */
async function fetchTransactions(ids: string[]): Promise<Transaction[]> {
  if (ids.length === 0) return [];

  const redis = getRedis();
  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.hgetall(KEYS.transaction(id));
  }
  const results = (await pipeline.exec()) as Array<Record<string, unknown> | null>;

  return results
    .map((raw) => parseTransaction(raw))
    .filter((t): t is Transaction => t !== null);
}

/**
 * Список операций от новых к старым.
 * Диапазон дат отсекается в Redis по score, остальные фильтры — в памяти.
 */
export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const redis = getRedis();

  const min = filters.from ? dateScore(filters.from) : 0;
  const max = filters.to ? dateScore(filters.to) : Number.MAX_SAFE_INTEGER;

  const ids = (await redis.zrange(KEYS.timeline, min, max, { byScore: true })) as string[];

  let transactions = await fetchTransactions(ids);

  if (filters.type && filters.type !== "all") {
    transactions = transactions.filter((t) => t.type === filters.type);
  }
  if (filters.categoryId) {
    transactions = transactions.filter((t) => t.categoryId === filters.categoryId);
  }
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      transactions = transactions.filter((t) => t.note.toLowerCase().includes(needle));
    }
  }

  return transactions.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, unknown>>(KEYS.transaction(id));
  return parseTransaction(raw);
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const redis = getRedis();
  const transaction: Transaction = { id: newId(), ...input, createdAt: Date.now() };

  await redis
    .pipeline()
    .hset(KEYS.transaction(transaction.id), { ...transaction })
    .zadd(KEYS.timeline, { score: dateScore(transaction.date), member: transaction.id })
    .exec();

  return transaction;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<Transaction | null> {
  const existing = await getTransaction(id);
  if (!existing) return null;

  const redis = getRedis();
  const updated: Transaction = { ...existing, ...input };

  const pipeline = redis.pipeline();
  pipeline.hset(KEYS.transaction(id), { ...updated });
  if (existing.date !== updated.date) {
    pipeline.zadd(KEYS.timeline, { score: dateScore(updated.date), member: id });
  }
  await pipeline.exec();

  return updated;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const existing = await getTransaction(id);
  if (!existing) return false;

  const redis = getRedis();
  await redis.pipeline().del(KEYS.transaction(id)).zrem(KEYS.timeline, id).exec();
  return true;
}

/* ------------------------------------------------------------------ */
/* Бюджеты                                                             */
/* ------------------------------------------------------------------ */

/** Лимиты всех категорий на указанный месяц. */
export async function getBudgets(month: string): Promise<Budget[]> {
  const redis = getRedis();
  const categoryIds = await redis.smembers(KEYS.budgetIndex);
  if (categoryIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const categoryId of categoryIds) {
    pipeline.hget(KEYS.budget(categoryId), month);
  }
  const limits = (await pipeline.exec()) as Array<number | string | null>;

  return categoryIds
    .map((categoryId, index) => ({
      categoryId,
      month,
      limit: toNumber(limits[index]),
    }))
    .filter((budget) => budget.limit > 0);
}

export async function setBudget(categoryId: string, month: string, limit: number): Promise<Budget> {
  const redis = getRedis();
  await redis
    .pipeline()
    .hset(KEYS.budget(categoryId), { [month]: limit })
    .sadd(KEYS.budgetIndex, categoryId)
    .exec();

  return { categoryId, month, limit };
}

export async function deleteBudget(categoryId: string, month: string): Promise<void> {
  const redis = getRedis();
  await redis.hdel(KEYS.budget(categoryId), month);

  // Если у категории не осталось лимитов ни на один месяц — убираем её из индекса.
  const remaining = await redis.hlen(KEYS.budget(categoryId));
  if (remaining === 0) {
    await redis.srem(KEYS.budgetIndex, categoryId);
  }
}

/** Лимиты вместе с фактическими тратами и процентом расхода. */
export async function getBudgetProgress(month: string): Promise<BudgetProgress[]> {
  const { from, to } = monthRange(month);
  const [budgets, transactions, categories] = await Promise.all([
    getBudgets(month),
    listTransactions({ from, to, type: "expense" }),
    getCategoryMap(),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const t of transactions) {
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  return budgets
    .map((budget): BudgetProgress => {
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        ...budget,
        spent,
        percent,
        remaining: budget.limit - spent,
        isExceeded: spent > budget.limit,
        isWarning: percent >= 80 && spent <= budget.limit,
        category: categories.get(budget.categoryId) ?? null,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

/* ------------------------------------------------------------------ */
/* Статистика для дашборда                                             */
/* ------------------------------------------------------------------ */

/** Сводка: баланс, показатели месяца, данные графиков и последние операции. */
export async function getDashboardStats(monthsBack = 6): Promise<DashboardStats> {
  const month = currentMonth();
  const [all, categories] = await Promise.all([listTransactions({}), getCategoryMap()]);

  let balance = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  const months = lastMonths(monthsBack);
  const monthlyMap = new Map<string, MonthlyPoint>(
    months.map((m) => [m, { month: m, label: formatMonthShort(m), income: 0, expense: 0 }])
  );
  const categoryTotals = new Map<string, number>();

  for (const t of all) {
    balance += (t.type === "income" ? 1 : -1) * t.amount;

    const tMonth = t.date.slice(0, 7);
    const point = monthlyMap.get(tMonth);
    if (point) {
      if (t.type === "income") point.income += t.amount;
      else point.expense += t.amount;
    }

    if (tMonth === month) {
      if (t.type === "income") {
        monthIncome += t.amount;
      } else {
        monthExpense += t.amount;
        categoryTotals.set(t.categoryId, (categoryTotals.get(t.categoryId) ?? 0) + t.amount);
      }
    }
  }

  const byCategory: CategoryPoint[] = [...categoryTotals.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? "Без категории",
        color: category?.color ?? "#94a3b8",
        icon: category?.icon ?? "❔",
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    balance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    month,
    monthly: months.map((m) => monthlyMap.get(m)!),
    byCategory,
    recent: all.slice(0, 5),
  };
}

/** Проверка типа операции, пришедшего из запроса. */
export function isTransactionType(value: unknown): value is TransactionType {
  return value === "income" || value === "expense";
}
