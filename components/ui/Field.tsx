import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint transition-colors focus:border-accent disabled:opacity-60";

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
  return <input {...props} className={`${CONTROL} h-10 ${className}`} />;
}

/** Выпадающий список в едином стиле формы. */
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${CONTROL} h-10 cursor-pointer ${className}`}>
      {children}
    </select>
  );
}
