"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/States";

interface Props {
  /** Куда вернуть пользователя после входа. */
  next: string;
  /** Вход ещё не настроен — показываем инструкцию вместо формы. */
  isConfigured: boolean;
}

/** Форма входа: логин, пароль, понятная ошибка при отказе. */
export function LoginForm({ next, isConfigured }: Props) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  if (!isConfigured) {
    return (
      <div className="space-y-3 text-sm text-muted">
        <p className="font-medium text-ink">Вход ещё не настроен</p>
        <p>Выполните в папке проекта команду и перезапустите приложение:</p>
        <pre className="tabular overflow-x-auto rounded-xl bg-canvas p-3 text-[13px] text-ink">
          npm run set-password
        </pre>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Не удалось войти");
        setPassword("");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("Сервер недоступен. Проверьте соединение.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner message={error} /> : null}

      <Field label="Логин" htmlFor="login">
        <Input
          id="login"
          name="username"
          autoComplete="username"
          autoFocus
          required
          value={login}
          onChange={(event) => setLogin(event.target.value)}
        />
      </Field>

      <Field label="Пароль" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" variant="primary" loading={isSubmitting} className="w-full justify-center">
        Войти
      </Button>
    </form>
  );
}
