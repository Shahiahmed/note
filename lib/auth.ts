import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Однопользовательская авторизация.
 *
 * Пароль нигде не хранится: в переменных окружения лежит только
 * PBKDF2-хеш со случайной солью. Сессия — подписанная HMAC-SHA256 кука,
 * то есть сервер не хранит список сессий и ничего не пишет в Redis.
 */

export const SESSION_COOKIE = "budget_session";

/** Сколько живёт сессия — 30 дней. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const PBKDF2_ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export interface AuthConfig {
  login: string;
  passwordHash: string;
  secret: string;
}

/**
 * Читает настройки входа из окружения.
 * Возвращает null, если вход ещё не настроен — тогда приложение
 * закрывается целиком, а не остаётся случайно открытым.
 */
export function getAuthConfig(): AuthConfig | null {
  const login = process.env.AUTH_LOGIN?.trim();
  const passwordHash = process.env.AUTH_PASSWORD_HASH?.trim();
  const secret = process.env.AUTH_SECRET?.trim();

  if (!login || !passwordHash || !secret) return null;

  return { login, passwordHash, secret };
}

/* ------------------------------------------------------------------ */
/* Пароль                                                              */
/* ------------------------------------------------------------------ */

/**
 * Считает хеш пароля в формате `pbkdf2:итерации:соль:хеш`.
 * Разделитель — двоеточие, а не `$`: Next.js разворачивает `$переменные`
 * в .env-файлах, и доллары в значении испортили бы хеш.
 */
export function hashPassword(password: string, iterations = PBKDF2_ITERATIONS): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password.normalize("NFKC"), salt, iterations, KEY_LENGTH, DIGEST);
  return `pbkdf2:${iterations}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Сравнивает пароль с хешем за постоянное время. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], "hex");
    expected = Buffer.from(parts[3], "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = pbkdf2Sync(password.normalize("NFKC"), salt, iterations, expected.length, DIGEST);
  return timingSafeEqual(expected, actual);
}

/** Сравнение строк за постоянное время — чтобы логин нельзя было подобрать по таймингу. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    // Всё равно считаем HMAC, чтобы время ответа не зависело от длины.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/* ------------------------------------------------------------------ */
/* Сессия                                                              */
/* ------------------------------------------------------------------ */

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Создаёт подписанный токен сессии. */
export function createSessionToken(login: string, secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ u: login, exp: expiresAt }), "utf8").toString(
    "base64url"
  );
  return `${payload}.${sign(payload, secret)}`;
}

/** Проверяет подпись и срок действия токена. */
export function verifySessionToken(token: string | undefined, config: AuthConfig): boolean {
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  if (!safeEqual(signature, sign(payload, config.secret))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: unknown;
      exp?: unknown;
    };

    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return false;
    if (typeof data.u !== "string" || data.u !== config.login) return false;

    return true;
  } catch {
    return false;
  }
}

/** Параметры куки сессии. */
export function sessionCookieOptions(maxAge: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
