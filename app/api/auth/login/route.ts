import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  getAuthConfig,
  safeEqual,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

/** Простая защита от перебора: пять неудач с одного адреса — пауза. */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;
const attempts = new Map<string, { count: number; until: number }>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

function checkLock(key: string): number {
  const entry = attempts.get(key);
  if (!entry) return 0;
  if (entry.until <= Date.now()) {
    attempts.delete(key);
    return 0;
  }
  return entry.count >= MAX_ATTEMPTS ? Math.ceil((entry.until - Date.now()) / 1000) : 0;
}

function registerFailure(key: string): void {
  const entry = attempts.get(key);
  const count = entry && entry.until > Date.now() ? entry.count + 1 : 1;
  attempts.set(key, { count, until: Date.now() + LOCK_MS });
}

/** POST /api/auth/login — вход по логину и паролю. */
export async function POST(request: NextRequest) {
  const config = getAuthConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Вход не настроен. Выполните npm run set-password." },
      { status: 503 }
    );
  }

  const key = clientKey(request);
  const lockedFor = checkLock(key);
  if (lockedFor > 0) {
    return NextResponse.json(
      { error: `Слишком много попыток. Попробуйте через ${Math.ceil(lockedFor / 60)} мин.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const login = String(data.login ?? "").trim();
  const password = String(data.password ?? "");

  if (!login || !password) {
    return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  // Пароль проверяем всегда, даже при неверном логине: иначе по времени
  // ответа можно было бы понять, что логин угадан.
  const loginOk = safeEqual(login.toLowerCase(), config.login.toLowerCase());
  const passwordOk = verifyPassword(password, config.passwordHash);

  if (!loginOk || !passwordOk) {
    registerFailure(key);
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  attempts.delete(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(config.login, config.secret), sessionCookieOptions());
  return response;
}
