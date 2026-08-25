import type {
  Budget,
  BudgetProgress,
  Category,
  CategoryInput,
  DashboardStats,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from "@/types";

/**
 * Обёртка над fetch для обращения к API приложения.
 * Ошибку с сервера превращает в Error с текстом из поля `error`.
 */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new Error("Нет связи с сервером. Проверьте подключение к сети.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Ошибка запроса (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

/** Собирает query-строку, пропуская пустые значения. */
function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export const api = {
  stats: () => request<DashboardStats>("/api/stats"),

  transactions: {
    list: (filters: TransactionFilters = {}) =>
      request<Transaction[]>(
        `/api/transactions${query({
          type: filters.type && filters.type !== "all" ? filters.type : undefined,
          categoryId: filters.categoryId,
          from: filters.from,
          to: filters.to,
          search: filters.search,
        })}`
      ),

    create: (input: TransactionInput) =>
      request<Transaction>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    update: (id: string, input: TransactionInput) =>
      request<Transaction>(`/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),

    remove: (id: string) =>
      request<{ ok: true }>(`/api/transactions/${id}`, { method: "DELETE" }),
  },

  categories: {
    list: () => request<Category[]>("/api/categories"),

    create: (input: CategoryInput) =>
      request<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    update: (id: string, input: CategoryInput) =>
      request<Category>(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),

    remove: (id: string) =>
      request<{ ok: true }>(`/api/categories/${id}`, { method: "DELETE" }),
  },

  budgets: {
    list: (month: string) => request<BudgetProgress[]>(`/api/budgets${query({ month })}`),

    set: (categoryId: string, month: string, limit: number) =>
      request<Budget>("/api/budgets", {
        method: "PUT",
        body: JSON.stringify({ categoryId, month, limit }),
      }),

    remove: (categoryId: string, month: string) =>
      request<{ ok: true }>(`/api/budgets${query({ categoryId, month })}`, {
        method: "DELETE",
      }),
  },
};
