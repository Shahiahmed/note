import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/AppNav";
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
};

export const viewport: Viewport = {
  themeColor: "#f5f6f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-2 text-xs text-faint">
          Данные хранятся в вашей базе Upstash Redis
        </footer>
      </body>
    </html>
  );
}
