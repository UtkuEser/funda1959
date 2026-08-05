import type { TimelineItem } from "@/content/storyPage";

/**
 * Zaman çizgisi — mobilde dikey, masaüstünde yatay.
 * Yatay kaydırma yapmaz; sütun sayısı ekrana göre azalır.
 */
export function StoryTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="grid gap-x-6 gap-y-9 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <li
          key={item.place}
          className="relative border-l border-stone/45 pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-6"
        >
          <span
            aria-hidden="true"
            className="absolute left-[-4.5px] top-1.5 h-2 w-2 rotate-45 bg-bordo lg:left-0 lg:top-[-4.5px]"
          />
          <p className="font-serif text-[22px] leading-none text-bordo">
            {item.year ?? "—"}
          </p>
          <p className="mt-3 font-sans text-[16px] leading-[1.45] text-ink">
            {item.place}
          </p>
        </li>
      ))}
    </ol>
  );
}
