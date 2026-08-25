import type { MetadataRoute } from "next";

/**
 * Манифест устанавливаемого приложения.
 *
 * Имя намеренно нейтральное: манифест обязан быть доступен без входа,
 * иначе браузер не предложит установку. Значит, его может прочитать любой,
 * кто откроет адрес, — и название не должно выдавать, что внутри финансы.
 * Под иконкой на телефоне видно `short_name`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Личный кабинет",
    short_name: "Кабинет",
    description: "Личный кабинет",
    lang: "ru",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6f8",
    theme_color: "#f5f6f8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
