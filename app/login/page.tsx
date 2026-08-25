import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { getAuthConfig } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Вход — Мой бюджет",
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
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-xl text-white">
          ₸
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Мой бюджет</h1>
          <p className="mt-1 text-sm text-muted">Войдите, чтобы увидеть свои финансы</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <LoginForm next={safeNext(params.next)} isConfigured={getAuthConfig() !== null} />
      </div>
    </div>
  );
}
