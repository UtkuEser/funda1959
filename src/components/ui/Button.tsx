import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "light" | "solid-light";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 font-sans text-[12px] font-medium uppercase tracking-[0.18em] transition-all duration-300";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-bordo text-cream hover:bg-bordo-dark",
  outline:
    "border border-bordo/35 text-bordo hover:border-bordo hover:bg-bordo hover:text-cream",
  ghost:
    "border-b border-bordo/30 px-0 py-2 text-bordo hover:border-bordo hover:text-bordo-dark",
  light:
    "border border-cream/45 text-cream hover:border-cream hover:bg-cream hover:text-bordo",
  "solid-light": "bg-cream text-bordo hover:bg-gold-soft hover:text-bordo-dark",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (external) {
    // tel: / mailto: bağlantıları yeni sekmede açılmaz.
    const isRemote = href.startsWith("http");
    return (
      <a
        href={href}
        className={classes}
        target={isRemote ? "_blank" : undefined}
        rel={isRemote ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
