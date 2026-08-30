"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

const inputBase =
  "h-12 w-full rounded-md border bg-cream-light px-3.5 font-sans text-[14px] text-espresso placeholder:text-taupe/55 focus:outline-none transition-colors";
const okBorder = "border-sand focus:border-burgundy";
const errBorder = "border-chocolate-light/60";

export function AuthField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-sans text-[12.5px] font-semibold text-espresso">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 font-sans text-[12.5px] text-chocolate-light">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 font-sans text-[12px] text-taupe">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type AuthInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  type?: string;
  name?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
};

export function AuthInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = "text",
  name,
  placeholder,
  autoComplete,
  inputMode,
}: AuthInputProps) {
  return (
    <input
      id={id}
      name={name ?? id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={`${inputBase} ${error ? errBorder : okBorder}`}
    />
  );
}

export function PasswordField({
  id,
  value,
  onChange,
  onBlur,
  error,
  name,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  name?: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name ?? id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputBase} pr-11 ${error ? errBorder : okBorder}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-taupe hover:text-burgundy"
      >
        {show ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.24A9.1 9.1 0 0112 4c4.5 0 8.2 3 9.5 7a10 10 0 01-2.3 3.5M6.6 6.6A10 10 0 002.5 11c1.3 4 5 7 9.5 7 1.2 0 2.3-.2 3.3-.6" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.5 12C3.8 8 7.5 5 12 5s8.2 3 9.5 7c-1.3 4-5 7-9.5 7s-8.2-3-9.5-7z" />
            <circle cx="12" cy="12" r="3" strokeWidth={1.6} />
          </svg>
        )}
      </button>
    </div>
  );
}

export function AuthCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2.5 font-sans text-[12.5px] leading-relaxed text-warm-brown"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy"
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 pl-[26px] font-sans text-[12.5px] text-chocolate-light">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  loading,
  loadingLabel,
}: {
  children: ReactNode;
  loading: boolean;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="h-12 w-full rounded-md bg-burgundy font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light disabled:cursor-not-allowed disabled:bg-burgundy/45"
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-sand-light" aria-hidden />
      <span className="font-sans text-[12px] text-taupe">{label}</span>
      <span className="h-px flex-1 bg-sand-light" aria-hidden />
    </div>
  );
}

export function AuthSuccess({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="rounded-lg border border-sand-light bg-cream-light p-5">
      <p className="font-serif text-[18px] font-semibold text-burgundy">{title}</p>
      <p className="mt-2 font-sans text-[14px] leading-relaxed text-warm-brown">{text}</p>
    </div>
  );
}
