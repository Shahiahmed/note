import type { NextRequest } from "next/server";
import { deleteBudget, getBudgetProgress, getCategory, setBudget } from "@/lib/redis";
import {
  NotFoundError,
  ValidationError,
  parseLimit,
  parseMonth,
  readJson,
  route,
} from "@/lib/http";
import { currentMonth } from "@/lib/format";

/** GET /api/budgets?month=ГГГГ-ММ — лимиты месяца вместе с прогрессом. */
export async function GET(request: NextRequest) {
  return route(() => {
    const raw = request.nextUrl.searchParams.get("month");
    const month = raw ? parseMonth(raw) : currentMonth();
    return getBudgetProgress(month);
  });
}

/** PUT /api/budgets — задать лимит расходов по категории на месяц. */
export async function PUT(request: NextRequest) {
  return route(async () => {
    const body = await readJson(request);
    const data = body as Record<string, unknown>;

    const categoryId = String(data?.categoryId ?? "").trim();
    if (!categoryId) throw new ValidationError("Не выбрана категория");

    const category = await getCategory(categoryId);
    if (!category) throw new NotFoundError("Категория не найдена");
    if (category.type !== "expense") {
      throw new ValidationError("Лимит можно задать только для категории расходов");
    }

    const month = parseMonth(data?.month);
    const limit = parseLimit(data?.limit);

    return setBudget(categoryId, month, limit);
  });
}

/** DELETE /api/budgets?categoryId=...&month=ГГГГ-ММ — снять лимит. */
export async function DELETE(request: NextRequest) {
  return route(async () => {
    const params = request.nextUrl.searchParams;

    const categoryId = (params.get("categoryId") ?? "").trim();
    if (!categoryId) throw new ValidationError("Не указана категория");

    const month = parseMonth(params.get("month"));
    await deleteBudget(categoryId, month);
    return { ok: true };
  });
}
