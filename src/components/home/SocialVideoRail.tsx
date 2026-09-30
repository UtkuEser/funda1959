"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type SocialVideoItem = {
  id: string;
  title: string;
  poster: string;
  /** CSS object-position for the 9:16 poster crop */
  posterPosition: string;
  /** null until the video file exists — no player is rendered without one */
  video: string | null;
};

function PlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 translate-x-px">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * Five 9:16 cards: a row on desktop, a snap-scrolling rail below it (one card
 * at a time on phones, 2–3 on tablets). Only one video plays at a time, muted,
 * and only after the visitor presses play.
 */
export function SocialVideoRail({ items }: { items: SocialVideoItem[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = railRef.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: smooth ? "smooth" : "auto" });
  };

  const scrollable = !(edges.start && edges.end);

  return (
    <div>
      <ul
        ref={railRef}
        onScroll={updateEdges}
        tabIndex={0}
        aria-label="Videolar — yatay kaydırmak için ok tuşlarını kullanın"
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isPlaying = playing === item.id && item.video;
          return (
            <li
              key={item.id}
              className="w-[72%] shrink-0 snap-start sm:w-[calc((100%-2rem)/2.4)] md:w-[calc((100%-2rem)/3)] lg:w-auto"
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-cream-dark">
                {isPlaying ? (
                  <video
                    src={item.video!}
                    poster={item.poster}
                    muted
                    playsInline
                    autoPlay
                    controls
                    onEnded={() => setPlaying(null)}
                    className="absolute inset-0 h-full w-full object-cover"
                    aria-label={item.title}
                  />
                ) : (
                  <>
                    <Image
                      src={item.poster}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 240px, (min-width: 768px) 32vw, 72vw"
                      className="object-cover"
                      style={{ objectPosition: item.posterPosition }}
                    />
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-espresso/55 to-transparent" />
                    {item.video ? (
                      <button
                        type="button"
                        onClick={() => setPlaying(item.id)}
                        className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none"
                        aria-label={`${item.title} videosunu oynat (sessiz)`}
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-light/90 text-burgundy shadow-sm transition-transform duration-300 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-cream-light">
                          <PlayIcon />
                        </span>
                      </button>
                    ) : (
                      <span className="absolute left-3 top-3 rounded-full bg-cream-light/90 px-2.5 py-1 font-sans text-[11px] font-semibold text-warm-brown">
                        Video yakında
                      </span>
                    )}
                    <p className="pointer-events-none absolute inset-x-3.5 bottom-3.5 font-sans text-[13.5px] font-medium leading-snug text-cream-light">
                      {item.title}
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {scrollable && (
        <div className="mt-4 flex items-center justify-end gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={edges.start}
            aria-label="Önceki video"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-burgundy/25 text-burgundy transition-colors hover:border-burgundy disabled:opacity-35"
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={edges.end}
            aria-label="Sonraki video"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-burgundy/25 text-burgundy transition-colors hover:border-burgundy disabled:opacity-35"
          >
            <Arrow dir="next" />
          </button>
        </div>
      )}
    </div>
  );
}
