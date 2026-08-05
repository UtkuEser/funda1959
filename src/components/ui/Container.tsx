import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  size?: "default" | "narrow" | "wide";
};

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-[1320px]",
  wide: "max-w-[1560px]",
};

export function Container({
  children,
  className = "",
  as: Tag = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full ${sizes[size]} px-5 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </Tag>
  );
}
