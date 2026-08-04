"use client";

import { useEffect, useRef, useState } from "react";

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "in" | "scale";
};

export function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass =
    direction === "up"
      ? "animate-fade-up"
      : direction === "scale"
      ? "animate-scale-in"
      : "animate-fade-in";

  const delayClass =
    delay === 100
      ? "delay-100"
      : delay === 200
      ? "delay-200"
      : delay === 300
      ? "delay-300"
      : delay === 400
      ? "delay-400"
      : delay === 500
      ? "delay-500"
      : delay === 600
      ? "delay-600"
      : "";

  return (
    <div
      ref={ref}
      className={`${visible ? `${animClass} ${delayClass}` : "opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
