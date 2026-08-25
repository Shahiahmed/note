import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/*
 * text-base на телефоне — не про вкусы, а про поведение iOS: Safari приближает
 * страницу, когда фокус попадает в поле со шрифтом меньше 16px, и обратно сам
 * не отдаляет. text-base = ровно 16px, поэтому экран стоит на месте.
 * На широких экранах возвращаем прежние 14px.
 *
 * h-11 на телефоне даёт 44px — минимальный удобный размер для пальца.
 */
const CONTROL =
  "w-full rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-faint transition-colors focus:border-accent disabled:opacity-60 sm:text-sm";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}

/** Подпись над полем ввода с необязательной подсказкой снизу. */
export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

/** Однострочное текстовое поле в едином стиле формы. */
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} h-11 sm:h-10 ${className}`} />;
}

/** Выпадающий список в едином стиле формы. */
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${CONTROL} h-11 cursor-pointer sm:h-10 ${className}`}>
      {children}
    </select>
  );
}
