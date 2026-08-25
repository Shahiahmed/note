import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Мой бюджет",
  description: "Личный учёт доходов, расходов и планирование бюджета в тенге",
  // Имя нейтральное: его видно в системе установки ещё до входа.
  applicationName: "Личный кабинет",
  appleWebApp: {
    capable: true,
    title: "Кабинет",
    statusBarStyle: "default",
  },
  // Чтобы iOS не превращал суммы и даты в телефонные ссылки.
  formatDetection: { telephone: false },
  // Next ставит современный mobile-web-app-capable; iOS до 17.4 понимает
  // только этот, устаревший. Без него на старом iPhone приложение
  // открывалось бы в обычном Safari, а не на весь экран.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#f5f6f8",
  width: "device-width",
  initialScale: 1,
  // Масштабирование не запрещаем: это ломает доступность.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        {/* pb-24 на телефоне — чтобы контент не уезжал под нижнюю панель. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:py-8 sm:pb-8">
          {children}
        </main>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
