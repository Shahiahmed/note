import type { NextRequest } from "next/server";
import { createTransaction, listTransactions } from "@/lib/redis";
import { parseTransactionInput, readJson, route } from "@/lib/http";
import type { TransactionFilters, TransactionType } from "@/types";

/** Собирает фильтры списка из query-параметров запроса. */
function readFilters(request: NextRequest): TransactionFilters {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");

  return {
    type: type === "income" || type === "expense" ? (type as TransactionType) : "all",
    categoryId: params.get("categoryId") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    search: params.get("search") ?? undefined,
  };
}

/** GET /api/transactions — список операций с фильтрами и поиском. */
export async function GET(request: NextRequest) {
  return route(() => listTransactions(readFilters(request)));
}

/** POST /api/transactions — создать операцию. */
export async function POST(request: NextRequest) {
  return route(async () => {
    const input = parseTransactionInput(await readJson(request));
    return createTransaction(input);
  });
}
