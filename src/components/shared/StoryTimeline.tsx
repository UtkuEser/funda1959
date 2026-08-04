import { storyTimeline } from "@/lib/data";
import { FadeIn } from "./FadeIn";

export function StoryTimeline() {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-sand to-transparent" />

      <div className="space-y-10 md:space-y-12">
        {storyTimeline.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <FadeIn key={item.year} delay={index < 3 ? ([0, 100, 200][index] as 0 | 100 | 200) : 0}>
              <div
                className={`relative flex items-start gap-6 md:gap-0 ${
                  isEven
                    ? "md:flex-row"
                    : "md:flex-row-reverse"
                }`}
              >
                {/* Content card */}
                <div
                  className={`pl-16 md:pl-0 md:w-[calc(50%-2.5rem)] ${
                    isEven ? "md:pr-12 md:text-right" : "md:pl-12"
                  }`}
                >
                  <div className="bg-cream-light border border-sand-light rounded-2xl p-6 hover:border-gold/40 hover:shadow-md transition-all duration-300">
                    <p className="font-sans text-xs tracking-[0.2em] uppercase text-gold mb-2 font-semibold">
                      {item.year}
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-chocolate mb-3">
                      {item.title}
                    </h3>
                    <p className="font-sans text-sm text-mocha leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Center dot */}
                <div
                  className={`absolute left-5 md:left-1/2 md:-translate-x-1/2 top-6 w-6 h-6 rounded-full bg-gold border-4 border-cream-light shadow-md z-10 flex items-center justify-center`}
                >
                  <div className="w-2 h-2 rounded-full bg-cream-light" />
                </div>

                {/* Spacer for other side */}
                <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
