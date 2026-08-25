import type { Category } from "@/types";

/**
 * Палитра категорий: восемь оттенков в фиксированном порядке.
 * Набор проверен на различимость при дальтонизме (worst adjacent ΔE 9.1),
 * поэтому цвета назначаются по порядку и не подбираются на глаз.
 */
export const CATEGORY_HUES = [
  "#2a78d6", // синий
  "#eb6834", // оранжевый
  "#1baf7a", // бирюзовый
  "#eda100", // жёлтый
  "#e87ba4", // розовый
  "#008300", // зелёный
  "#4a3aa7", // фиолетовый
  "#e34948", // красный
] as const;

/** Категории, которыми база наполняется при первом обращении. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Еда", icon: "🍔", color: CATEGORY_HUES[0], type: "expense", isDefault: true },
  { id: "transport", name: "Транспорт", icon: "🚌", color: CATEGORY_HUES[1], type: "expense", isDefault: true },
  { id: "housing", name: "Жильё", icon: "🏠", color: CATEGORY_HUES[2], type: "expense", isDefault: true },
  { id: "entertainment", name: "Развлечения", icon: "🎬", color: CATEGORY_HUES[3], type: "expense", isDefault: true },
  { id: "health", name: "Здоровье", icon: "💊", color: CATEGORY_HUES[4], type: "expense", isDefault: true },
  { id: "connection", name: "Связь и интернет", icon: "📱", color: CATEGORY_HUES[5], type: "expense", isDefault: true },
  { id: "clothes", name: "Одежда", icon: "👕", color: CATEGORY_HUES[6], type: "expense", isDefault: true },
  { id: "other-expense", name: "Прочие расходы", icon: "💸", color: CATEGORY_HUES[7], type: "expense", isDefault: true },

  { id: "salary", name: "Зарплата", icon: "💼", color: "#1c5cab", type: "income", isDefault: true },
  { id: "freelance", name: "Подработка", icon: "🧑‍💻", color: "#199e70", type: "income", isDefault: true },
  { id: "investments", name: "Инвестиции", icon: "📈", color: "#9085e9", type: "income", isDefault: true },
  { id: "other-income", name: "Прочие доходы", icon: "🪙", color: "#c98500", type: "income", isDefault: true },
];

/** Цвета, предлагаемые при создании своей категории. */
export const COLOR_PALETTE = [
  ...CATEGORY_HUES,
  "#1c5cab", "#199e70", "#9085e9", "#c98500", "#d55181", "#d95926",
];

/** Набор иконок для новой категории. */
export const ICON_PALETTE = [
  "🍔", "🛒", "🚌", "🚗", "⛽", "🏠", "💡", "🎬", "🎮", "✈️",
  "💊", "🏥", "📚", "🎓", "👕", "👟", "📱", "💻", "🎁", "🐾",
  "☕", "🍺", "💇", "🏋️", "🧾", "💸", "💼", "🪙", "📈", "🏦",
];

/** Цвет столбца доходов на графике (проверен вместе с EXPENSE_MARK). */
export const INCOME_MARK = "#0d9488";
/** Цвет столбца расходов на графике. */
export const EXPENSE_MARK = "#e11d48";

/** Сколько долей показывать на круговой диаграмме до свёртки в «Другое». */
export const PIE_SLICE_LIMIT = 7;
/** Цвет доли «Другое». */
export const OTHER_SLICE_COLOR = "#7c8a9c";
