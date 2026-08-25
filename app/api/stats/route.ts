import { getDashboardStats } from "@/lib/redis";
import { route } from "@/lib/http";

/** GET /api/stats — сводные данные для дашборда. */
export async function GET() {
  return route(() => getDashboardStats());
}
