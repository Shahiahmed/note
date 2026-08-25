import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Закрывает всё приложение за логином.
 *
 * Проверка стоит здесь, до рендера страниц и до API-роутов, поэтому
 * данные не утекут ни через прямой запрос к /api/transactions,
 * ни через открытую по ссылке страницу.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const config = getAuthConfig();

  // Вход не настроен — не открываем приложение «на всякий случай».
  if (!config) {
    if (isApi) {
      return NextResponse.json(
        { error: "Вход не настроен. Выполните npm run set-password." },
        { status: 503 }
      );
    }
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const isAuthenticated = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, config);

  // Авторизованного со страницы входа отправляем на дашборд.
  if (pathname === "/login") {
    return isAuthenticated
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (isAuthenticated) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Всё, кроме служебных путей:
     * - /api/auth/*  — сам вход и выход
     * - _next/*      — сборка Next
     * - manifest.webmanifest, sw.js — установка на телефон: браузер просит их
     *                  до входа, и закрыть их значит сломать установку.
     *                  Данных внутри нет, только имя и иконки.
     * - favicon.ico и картинки
     */
    "/((?!api/auth|_next/static|_next/image|manifest.webmanifest|sw.js|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
