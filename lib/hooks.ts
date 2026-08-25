"use client";

import { useCallback, useEffect, useState } from "react";

/** Результат последнего завершившегося запроса и его «отпечаток». */
interface Result<T> {
  loader: () => Promise<T>;
  nonce: number;
  data: T | null;
  error: string | null;
}

interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Перезапрашивает данные, например после изменения. */
  reload: () => void;
}

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Не удалось загрузить данные";
}

/**
 * Загружает данные и держит состояния загрузки и ошибки.
 * `loader` нужно оборачивать в useCallback — от него зависит перезапрос.
 *
 * Флаг загрузки не хранится в состоянии, а выводится из того, совпадает
 * ли последний полученный результат с текущим запросом. Так состояние
 * меняется только в ответ на завершённый запрос, без лишних перерисовок.
 */
export function useAsyncData<T>(loader: () => Promise<T>): AsyncData<T> {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [nonce, setNonce] = useState(0);

  const loading = result === null || result.loader !== loader || result.nonce !== nonce;

  useEffect(() => {
    // Ответ устаревшего запроса не должен затирать свежие данные.
    let active = true;

    loader()
      .then((data) => {
        if (active) setResult({ loader, nonce, data, error: null });
      })
      .catch((cause: unknown) => {
        if (active) setResult({ loader, nonce, data: null, error: message(cause) });
      });

    return () => {
      active = false;
    };
  }, [loader, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return {
    // Пока идёт перезапрос, показываем прошлые данные — список не мигает.
    data: result?.data ?? null,
    loading,
    error: loading ? null : (result?.error ?? null),
    reload,
  };
}
