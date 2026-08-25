import type { NextRequest } from "next/server";
import {
  countTransactionsInCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/lib/redis";
import { NotFoundError, ValidationError, parseCategoryInput, readJson, route } from "@/lib/http";

type Context = RouteContext<"/api/categories/[id]">;

/** PUT /api/categories/:id — изменить категорию. */
export async function PUT(request: NextRequest, ctx: Context) {
  return route(async () => {
    const { id } = await ctx.params;
    const input = parseCategoryInput(await readJson(request));
    const updated = await updateCategory(id, input);
    if (!updated) throw new NotFoundError("Категория не найдена");
    return updated;
  });
}

/**
 * DELETE /api/categories/:id — удалить свою категорию.
 * Предустановленные категории и категории с операциями удалить нельзя.
 */
export async function DELETE(_request: NextRequest, ctx: Context) {
  return route(async () => {
    const { id } = await ctx.params;

    const category = await getCategory(id);
    if (!category) throw new NotFoundError("Категория не найдена");
    if (category.isDefault) {
      throw new ValidationError("Предустановленную категорию удалить нельзя");
    }

    const used = await countTransactionsInCategory(id);
    if (used > 0) {
      throw new ValidationError(
        `Категория используется в операциях (${used}). Сначала измените или удалите их.`
      );
    }

    await deleteCategory(id);
    return { ok: true };
  });
}
