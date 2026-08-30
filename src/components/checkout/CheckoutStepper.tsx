const STEPS = ["Bilgiler", "Teslimat", "Onay"];

export function CheckoutStepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <nav aria-label="Sipariş adımları">
      {/* Mobile: compact */}
      <p className="font-sans text-[13px] font-semibold text-burgundy sm:hidden">
        {current + 1}/3 · {STEPS[current]}
      </p>

      {/* Desktop */}
      <ol className="hidden items-center gap-3 sm:flex">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => i <= current && onStepClick(i)}
                aria-current={active ? "step" : undefined}
                disabled={i > current}
                className={`flex items-center gap-2 font-sans text-[13px] transition-colors ${
                  active
                    ? "font-semibold text-burgundy"
                    : done
                      ? "font-medium text-burgundy/80 hover:text-burgundy"
                      : "font-medium text-taupe"
                } ${i > current ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    active || done
                      ? "border-burgundy bg-burgundy text-cream-light"
                      : "border-sand text-taupe"
                  }`}
                >
                  {done ? "✓" : String(i + 1).padStart(2, "0").slice(-1)}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <span className="h-px w-10 bg-sand" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
