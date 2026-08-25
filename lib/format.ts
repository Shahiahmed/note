const NUMBER_FORMAT = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/** Разбивает число на разряды неразрывными пробелами: 1 500 000. */
export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value).replace(/\u00a0/g, " ");
}

/** Форматирует сумму в тенге: «1 500 000 ₸». */
export function formatMoney(value: number): string {
  return `${formatNumber(value)} ₸`;
}

/** Добавляет знак к сумме: «+1 500 ₸» или «−1 500 ₸». */
export function formatSigned(value: number): string {
  if (value === 0) return formatMoney(0);
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

/** Короткая запись суммы для осей графиков: «1,5 млн», «250 тыс.». */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)} млн`;
  if (abs >= 1_000) return `${trim(value / 1_000)} тыс.`;
  return formatNumber(value);
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "").replace(".", ",");
}

/** Дата YYYY-MM-DD в виде «25 авг. 2026». */
export function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

/** Месяц YYYY-MM в виде «август 2026». */
export function formatMonth(month: string): string {
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  return parsed.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

/** Короткая подпись месяца для оси графика: «авг. 26». */
export function formatMonthShort(month: string): string {
  const parsed = new Date(`${month}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return month;
  // «авг. 26 г.» → «авг. 26»: хвост «г.» на оси графика только шумит.
  return parsed
    .toLocaleDateString("ru-RU", { month: "short", year: "2-digit" })
    .replace(/\s*г\.$/, "");
}

/**
 * Часовой пояс, в котором приложение решает, какое сегодня число.
 *
 * Без него сервер считал бы дату по своему времени: на Vercel это UTC,
 * то есть с полуночи до 5 утра по Алматы «сегодня» отставало бы на день,
 * а первого числа месяца — ещё и на месяц. Норма трат на день от этого
 * поехала бы. Переопределяется через NEXT_PUBLIC_APP_TIMEZONE.
 */
const TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim() || "Asia/Almaty";

/** en-CA даёт ровно нужный вид: 2026-08-25. */
const ISO_DATE_FORMAT = (() => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    // Пояс написан с ошибкой — не роняем приложение, откатываемся на локальное время.
    return null;
  }
})();

/** Текущая дата в формате YYYY-MM-DD. */
export function todayISO(): string {
  return ISO_DATE_FORMAT ? ISO_DATE_FORMAT.format(new Date()) : toISODate(new Date());
}

/** Дата в формате YYYY-MM-DD по локальному времени (без сдвига UTC). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Текущий месяц в формате YYYY-MM. */
export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

/** Сколько дней в месяце YYYY-MM. */
export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  // Нулевой день следующего месяца — это последний день текущего.
  return new Date(year, m, 0).getDate();
}

/** Номер дня в дате YYYY-MM-DD: для «2026-08-25» вернёт 25. */
export function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

/** Первый и последний день месяца YYYY-MM в формате YYYY-MM-DD. */
export function monthRange(month: string): { from: string; to: string } {
  const last = daysInMonth(month);
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** Последние `count` месяцев по возрастанию, заканчивая текущим. */
export function lastMonths(count: number): string[] {
  // Отсчитываем от currentMonth(), а не от new Date(): иначе на границе месяца
  // график и карточки показывали бы разные месяцы.
  const [year, month] = currentMonth().split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(year, month - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/** Русское склонение слова «день»: 1 день, 2 дня, 5 дней. */
export function pluralDays(count: number): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}
