"use client";

import { useEffect } from "react";

/**
 * Регистрирует service worker — без него браузер не считает сайт
 * приложением и не предлагает установку на домашний экран.
 * Работает только по HTTPS и на localhost; в остальных случаях
 * тихо ничего не делает.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      // Ошибку глушим намеренно: не установилось — приложение всё равно работает.
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
