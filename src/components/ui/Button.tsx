import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "light" | "lightSolid";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
};

const base =
  "inline-flex items-center justify-center px-8 py-4 font-sans text-[14px] uppercase tracking-[0.14em] transition-colors duration-300";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-bordo text-cream hover:bg-bordo-dark",
  outline: "border border-bordo/45 text-bordo hover:bg-bordo hover:text-cream",
  light: "border border-cream/60 text-cream hover:bg-cream hover:text-bordo",
  lightSolid: "bg-cream text-bordo hover:bg-cream-2",
};

export function Button({
  href,
  children,
  variant = "solid",
  className = "",
  external = false,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (external) {
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

