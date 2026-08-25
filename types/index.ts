/** Тип операции: доход или расход. */
export type TransactionType = "income" | "expense";

/** Финансовая операция. */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** Сумма в тенге, всегда положительное число. */
  amount: number;
  /** Идентификатор категории. */
  categoryId: string;
  /** Дата операции в формате YYYY-MM-DD. */
  date: string;
  /** Произвольная заметка пользователя. */
  note: string;
  /** Момент создания записи, мс. */
  createdAt: number;
}

/** Данные для создания или полного обновления операции. */
export interface TransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;
  note: string;
}

/** Категория доходов или расходов. */
export interface Category {
  id: string;
  name: string;
  /** Эмодзи-иконка категории. */
  icon: string;
  /** HEX-цвет для графиков и меток. */
  color: string;
  type: TransactionType;
  /** Предустановленные категории нельзя удалить. */
  isDefault: boolean;
}

/** Данные для создания или обновления категории. */
export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

/** Лимит расходов по категории на конкретный месяц. */
export interface Budget {
  categoryId: string;
  /** Месяц в формате YYYY-MM. */
  month: string;
  limit: number;
}

/** Лимит вместе с фактическими тратами за месяц. */
export interface BudgetProgress extends Budget {
  spent: number;
  /** Процент израсходованного лимита (может превышать 100). */
  percent: number;
  remaining: number;
  isExceeded: boolean;
  /** Потрачено 80% лимита или больше, но лимит ещё не превышен. */
  isWarning: boolean;
  category: Category | null;
}

/** Фильтры списка операций. */
export interface TransactionFilters {
  type?: TransactionType | "all";
  categoryId?: string;
  /** Начало диапазона дат, YYYY-MM-DD. */
  from?: string;
  /** Конец диапазона дат, YYYY-MM-DD. */
  to?: string;
  /** Поиск по тексту заметки. */
  search?: string;
}

/** Сумма доходов и расходов за один месяц. */
export interface MonthlyPoint {
  /** Месяц в формате YYYY-MM. */
  month: string;
  /** Подпись для оси графика, например «авг. 25». */
  label: string;
  income: number;
  expense: number;
}

/** Доля одной категории в расходах. */
export interface CategoryPoint {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
}

/** Сводные данные для дашборда. */
/**
 * Сколько можно тратить в день, чтобы денег хватило до конца месяца.
 * Считается от баланса на начало сегодняшнего дня, поэтому норма
 * не прыгает после каждой покупки — вместо неё убывает `leftToday`.
 */
export interface DailyBudget {
  /** Дата, на которую всё посчитано, YYYY-MM-DD. */
  today: string;
  /** Всего дней в месяце. */
  daysInMonth: number;
  /** Дней до конца месяца, считая сегодняшний. */
  daysLeft: number;
  /** Деньги, которые распределяются: баланс на начало дня, но не меньше нуля. */
  available: number;
  /** Норма на один день. */
  perDay: number;
  /** Уже потрачено сегодня. */
  spentToday: number;
  /** Сколько ещё можно потратить сегодня, не выходя из нормы. */
  leftToday: number;
  /** Фактический средний расход в день с начала месяца. */
  averagePerDay: number;
}

export interface DashboardStats {
  /** Баланс за всё время: доходы минус расходы. */
  balance: number;
  monthIncome: number;
  monthExpense: number;
  /** Остаток за текущий месяц. */
  monthNet: number;
  /** Текущий месяц в формате YYYY-MM. */
  month: string;
  monthly: MonthlyPoint[];
  byCategory: CategoryPoint[];
  recent: Transaction[];
  /** План трат на оставшиеся дни месяца. */
  dailyBudget: DailyBudget;
}

/** Единый формат ошибки API. */
export interface ApiError {
  error: string;
}
