import type { ReactNode } from "react";

/** Hikayemiz sayfasına özel, biraz daha dar okuma alanı (maks. 1320px). */
export function StoryContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1320px] px-6 md:px-12 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}
