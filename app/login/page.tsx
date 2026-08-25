import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { getAuthConfig } from "@/lib/auth";

/**
 * Страница открыта всему интернету, поэтому она ничего не рассказывает
 * о приложении: ни названия, ни намёка на то, какие данные внутри.
 */
export const metadata: Metadata = {
  title: "Вход",
  description: "Страница входа",
  robots: { index: false, follow: false },
};

/** Возвращает безопасный внутренний путь: чужие ссылки сюда не подставить. */
function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/** Страница входа — единственная, открытая без сессии. */
export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="10" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Вход</h1>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <LoginForm next={safeNext(params.next)} isConfigured={getAuthConfig() !== null} />
      </div>
    </div>
  );
}
