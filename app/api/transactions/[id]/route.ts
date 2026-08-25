import type { NextRequest } from "next/server";
import { deleteTransaction, getTransaction, updateTransaction } from "@/lib/redis";
import {
  assertCategoryFits,
  NotFoundError,
  parseTransactionInput,
  readJson,
  route,
} from "@/lib/http";

type Context = RouteContext<"/api/transactions/[id]">;

/** GET /api/transactions/:id — одна операция. */
export async function GET(_request: NextRequest, ctx: Context) {
  return route(async () => {
    const { id } = await ctx.params;
    const transaction = await getTransaction(id);
    if (!transaction) throw new NotFoundError("Операция не найдена");
    return transaction;
  });
}

/** PUT /api/transactions/:id — изменить операцию. */
export async function PUT(request: NextRequest, ctx: Context) {
  return route(async () => {
    const { id } = await ctx.params;
    const input = parseTransactionInput(await readJson(request));
    await assertCategoryFits(input);
    const updated = await updateTransaction(id, input);
    if (!updated) throw new NotFoundError("Операция не найдена");
    return updated;
  });
}

/** DELETE /api/transactions/:id — удалить операцию. */
export async function DELETE(_request: NextRequest, ctx: Context) {
  return route(async () => {
    const { id } = await ctx.params;
    const deleted = await deleteTransaction(id);
    if (!deleted) throw new NotFoundError("Операция не найдена");
    return { ok: true };
  });
}
