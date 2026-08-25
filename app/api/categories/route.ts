import type { NextRequest } from "next/server";
import { createCategory, getCategories } from "@/lib/redis";
import { parseCategoryInput, readJson, route } from "@/lib/http";

/** GET /api/categories — все категории. */
export async function GET() {
  return route(() => getCategories());
}

/** POST /api/categories — создать свою категорию. */
export async function POST(request: NextRequest) {
  return route(async () => {
    const input = parseCategoryInput(await readJson(request));
    return createCategory(input);
  });
}
