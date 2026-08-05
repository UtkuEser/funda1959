import type { Metadata } from "next";
import { CtaBand } from "@/components/shared/CtaBand";
import { Reveal } from "@/components/ui/Reveal";
import { ArchiveFrame } from "@/components/story/ArchiveFrame";
import { Chapter } from "@/components/story/Chapter";
import { StoryContainer } from "@/components/story/StoryContainer";
import {
  foundingChapter,
  growthChapter,
  storyChaptersContent,
  storyCta,
  storyHero,
  todayChapter,
} from "@/content/storyPage";
import {
  storyImageFour,
  storyImageOne,
  storyImageThree,
  storyImageTwo,
} from "@/content/storyImages";

export const metadata: Metadata = {
  title: "Hikayemiz",
  description:
    "Çamlıhemşin’den Moskova’ya, Yalta’dan Ankara’ya uzanan bir aile mesleği: Funda 1959’un kuşaklar boyunca aktarılan pastacılık hikâyesi.",
};

const [koklerChapter, ustalikChapter, donusChapter] = storyChaptersContent;

export default function StoryPage() {
  return (
    <>
      {/* 1 — Hero */}
      <section className="bg-cream pb-16 pt-36 md:pb-20 md:pt-44">
        <StoryContainer>
          <p className="font-sans text-[13px] uppercase tracking-[0.22em] text-bordo/80">
            {storyHero.label}
          </p>

          <h1 className="mt-6 max-w-[16ch] font-serif text-[clamp(2.5rem,4.8vw,5rem)] leading-[1.04] text-ink">
            {storyHero.title}
          </h1>

          <p className="mt-8 max-w-[70ch] font-sans text-[clamp(1.0625rem,0.5vw+0.9rem,1.25rem)] leading-[1.75] text-ink-soft">
            {storyHero.description}
          </p>
        </StoryContainer>
      </section>

      {/* İlk iki arşiv karesi */}
      <section className="bg-cream pb-24 md:pb-28 lg:pb-32">
        <StoryContainer>
          <div className="grid gap-8 sm:grid-cols-2 lg:gap-12">
            <ArchiveFrame
              image={storyImageOne}
              sizes="(max-width: 640px) 88vw, (max-width: 1320px) 44vw, 600px"
              priority
            />
            <ArchiveFrame
              image={storyImageTwo}
              sizes="(max-width: 640px) 88vw, (max-width: 1320px) 44vw, 600px"
              className="sm:mt-12"
            />
          </div>
        </StoryContainer>
      </section>

      {/* 2 — Kökler */}
      <section className="bg-cream-2 py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              id="kokler"
              label={koklerChapter.label}
              title={koklerChapter.title}
              paragraphs={koklerChapter.paragraphs}
              emphasis={koklerChapter.emphasis}
              mediaSide="right"
              media={
                <ArchiveFrame
                  image={storyImageThree}
                  sizes="(max-width: 1024px) 88vw, 420px"
                />
              }
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 3 — Ustalığın yolculuğu */}
      <section className="bg-cream py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              id="ustalik"
              label={ustalikChapter.label}
              title={ustalikChapter.title}
              paragraphs={ustalikChapter.paragraphs}
              emphasis={ustalikChapter.emphasis}
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 4 — Türkiye'ye dönüş */}
      <section className="bg-cream-2 py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              id="donus"
              label={donusChapter.label}
              title={donusChapter.title}
              paragraphs={donusChapter.paragraphs}
              emphasis={donusChapter.emphasis}
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 5 — 1959 */}
      <section className="bg-cream py-24 md:py-28 lg:py-36">
        <StoryContainer>
          <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="font-sans text-[13px] uppercase tracking-[0.18em] text-bordo/80">
                {foundingChapter.label}
              </p>

              <p className="mt-4 font-serif text-[clamp(5rem,12vw,11rem)] leading-[0.82] tracking-[-0.02em] text-bordo">
                {foundingChapter.year}
              </p>

              <h2 className="mt-8 max-w-[18ch] font-serif text-[clamp(1.75rem,2.9vw,3rem)] leading-[1.12] text-ink">
                {foundingChapter.title}
              </h2>

              <div className="mt-8 space-y-6">
                {foundingChapter.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 28)}
                    className="max-w-[70ch] font-sans text-[clamp(1.0625rem,0.35vw+0.95rem,1.1875rem)] leading-[1.75] text-ink-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <p className="mt-10 max-w-[34ch] border-l-2 border-bordo/50 pl-6 font-serif text-[clamp(1.375rem,1.9vw,2rem)] leading-[1.35] text-bordo">
                {foundingChapter.emphasis}
              </p>
            </div>

            <Reveal className="lg:col-span-6">
              <ArchiveFrame
                image={storyImageFour}
                sizes="(max-width: 1024px) 88vw, 560px"
                className="lg:sticky lg:top-32"
              />
            </Reveal>
          </div>
        </StoryContainer>
      </section>

      {/* 6 — Ankara'da büyüyen pastane kültürü */}
      <section className="bg-cream-2 py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              label={growthChapter.label}
              title={growthChapter.title}
              paragraphs={growthChapter.paragraphs}
              emphasis={growthChapter.emphasis}
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 7 — Geçmişten bugüne */}
      <section className="bg-cream py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              label={todayChapter.label}
              title={todayChapter.title}
              paragraphs={todayChapter.paragraphs}
              emphasis={todayChapter.emphasis}
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 8 — Kapanış */}
      <CtaBand
        title={storyCta.title}
        description={storyCta.description}
        primary={storyCta.primary}
        secondary={storyCta.secondary}
      />
    </>
  );
}
