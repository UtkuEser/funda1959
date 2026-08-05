import type { Metadata } from "next";
import { CtaBand } from "@/components/shared/CtaBand";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { ArchiveFrame } from "@/components/story/ArchiveFrame";
import { Chapter } from "@/components/story/Chapter";
import { PullQuote } from "@/components/story/PullQuote";
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
import { images } from "@/content/images";

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
      <section className="bg-cream pb-14 pt-36 md:pb-16 md:pt-44">
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

      {/* İki görselli açılış kompozisyonu */}
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
              className="sm:mt-14"
            />
          </div>
        </StoryContainer>
      </section>

      {/* 2 — Kökler: geniş metin, kapanışta tam genişlik alıntı */}
      <section className="bg-cream-2 py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              id="kokler"
              label={koklerChapter.label}
              title={koklerChapter.title}
              paragraphs={koklerChapter.paragraphs}
            />
          </Reveal>

          <div className="mt-20 lg:mt-24">
            <PullQuote>{koklerChapter.emphasis}</PullQuote>
          </div>
        </StoryContainer>
      </section>

      {/* 3 — Ustalığın yolculuğu: metin solda, görsel sağda */}
      <section className="bg-cream py-24 md:py-28 lg:py-32">
        <StoryContainer>
          <Reveal>
            <Chapter
              id="ustalik"
              label={ustalikChapter.label}
              title={ustalikChapter.title}
              paragraphs={ustalikChapter.paragraphs}
              emphasis={ustalikChapter.emphasis}
              mediaSide="right"
              media={
                <ArchiveFrame
                  image={storyImageThree}
                  sizes="(max-width: 1024px) 88vw, 420px"
                  caption="Ailenin pastacılık yıllarından"
                />
              }
            />
          </Reveal>
        </StoryContainer>
      </section>

      {/* 4 — Türkiye'ye dönüş: sade metin bloğu */}
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

      {/* 5 — 1959: büyük tarih ve arşiv görseli */}
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
                caption="Funda Pastanesi’nin ilk yıllarından"
                className="lg:sticky lg:top-32"
              />
            </Reveal>
          </div>
        </StoryContainer>
      </section>

      {/* 6 — Şehrin farklı noktalarında aynı sofra */}
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

      {/* 7 — Aynı hikâyenin yeni dönemi */}
      <section className="bg-cream pt-24 md:pt-28 lg:pt-32">
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

      {/* Geçmişten bugüne geçiş — güncel, renkli kare */}
      <section className="bg-cream pb-24 pt-16 md:pb-28 md:pt-20 lg:pb-32">
        <StoryContainer>
          <Reveal>
            <Figure
              asset={images.bugununFundasi}
              sizes="(max-width: 1320px) 92vw, 1200px"
            />
          </Reveal>

          <p className="mt-8 max-w-[38ch] font-serif text-[clamp(1.375rem,2vw,2rem)] leading-[1.35] text-ink">
            Geçmişten gelen bu hikâye, bugün Funda’nın masalarında yaşamaya devam
            ediyor.
          </p>
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
