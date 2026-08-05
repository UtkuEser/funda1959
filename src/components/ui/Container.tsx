import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  size?: "default" | "narrow";
};

const sizes = {
  default: "max-w-[1440px]",
  narrow: "max-w-[760px]",
};

export function Container({
  children,
  className = "",
  as: Tag = "div",
  size = "default",
}: ContainerProps) {
  return (
    <Tag
      className={`mx-auto w-full px-6 md:px-12 lg:px-[72px] ${sizes[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}
