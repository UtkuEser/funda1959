import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow";
};

/**
 * Shared page container so every section shares the same left/right edge,
 * max width and horizontal rhythm across the site.
 */
export function Container({ children, className = "", size = "default" }: ContainerProps) {
  const max = size === "narrow" ? "max-w-[920px]" : "max-w-[1320px]";
  return (
    <div className={`mx-auto ${max} px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>
  );
}
