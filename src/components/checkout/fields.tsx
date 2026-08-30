import type { ReactNode } from "react";

const inputBase =
  "w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso placeholder:text-taupe/55 focus:outline-none transition-colors";

function borderClass(error?: string) {
  return error ? "border-chocolate-light/60" : "border-sand focus:border-burgundy";
}

export function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-sans text-[13px] font-semibold text-espresso">
        {label}
        {optional && <span className="ml-1 font-normal text-taupe">(opsiyonel)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 font-sans text-[12.5px] text-chocolate-light">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
};

export function TextField({ id, value, onChange, error, ...rest }: TextFieldProps) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} h-12 ${borderClass(error)}`}
      {...rest}
    />
  );
}

export function TextAreaField({
  id,
  value,
  onChange,
  error,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} resize-none py-2.5 leading-relaxed ${borderClass(error)}`}
    />
  );
}

export function SelectField({
  id,
  value,
  onChange,
  error,
  placeholder,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${inputBase} h-12 ${borderClass(error)} ${value ? "" : "text-taupe/70"}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <div className="rounded-md border border-sand px-4 py-3 transition-colors peer-checked:border-burgundy peer-checked:bg-burgundy/[0.05] peer-focus-visible:ring-2 peer-focus-visible:ring-burgundy/40">
        {children}
      </div>
    </label>
  );
}
