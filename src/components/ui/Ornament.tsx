/**
 * Motif sistemi — tek bir dil: Yunan meander (Greek key) bordürü.
 *
 * Sitedeki bütün dekoratif parçalar bu motiften türer:
 * bordür bandı, section ayracı, kart köşesi, yüzey dokusu ve amblem çerçevesi.
 */

type Tone = "gold" | "bordo" | "cream";

const toneMap: Record<Tone, string> = {
  gold: "text-gold",
  bordo: "text-bordo",
  cream: "text-cream",
};

/** Meander biriminin geometrisi — tüm parçalar bunu kullanır. */
const KEY_TILE = { w: 22, h: 16, rail: 14 };
const KEY_PATH = "M3.5 14V3h15v8H9v-4h5";

/* ---------------------------------------------------------------
   Bordür bandı — header altı, hero altı, section ayrımları, footer üstü
   --------------------------------------------------------------- */

type BandProps = {
  className?: string;
  tone?: Tone;
  /** Motifin ölçeği (1 = 16px yükseklik). */
  scale?: number;
  id?: string;
  /** Üstte ve altta ince çift çizgi. */
  rules?: boolean;
};

export function OrnamentBand({
  className = "",
  tone = "gold",
  scale = 1,
  id = "band",
  rules = true,
}: BandProps) {
  const patternId = `meander-${id}`;
  const tileW = KEY_TILE.w * scale;
  const tileH = KEY_TILE.h * scale;
  const height = Math.round(tileH + (rules ? 12 * scale : 0));
  const keyTop = rules ? 6 * scale : 0;

  return (
    <div
      className={`w-full overflow-hidden ${toneMap[tone]} ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <svg width="100%" height={height} className="block">
        <defs>
          <pattern
            id={patternId}
            width={tileW}
            height={tileH}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0 ${keyTop}) scale(${scale})`}
          >
            <path
              d={`M0 ${KEY_TILE.rail}H${KEY_TILE.w}`}
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              opacity="0.9"
            />
            <path
              d={KEY_PATH}
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="square"
              opacity="0.9"
            />
          </pattern>
        </defs>

        {rules ? (
          <>
            <rect x="0" y={2 * scale} width="100%" height={0.9 * scale} fill="currentColor" opacity="0.55" />
            <rect x="0" y={4 * scale} width="100%" height={0.6 * scale} fill="currentColor" opacity="0.3" />
          </>
        ) : null}

        <rect
          x="0"
          y={keyTop}
          width="100%"
          height={tileH}
          fill={`url(#${patternId})`}
          opacity="0.75"
        />

        {rules ? (
          <>
            <rect
              x="0"
              y={height - 4 * scale}
              width="100%"
              height={0.6 * scale}
              fill="currentColor"
              opacity="0.3"
            />
            <rect
              x="0"
              y={height - 2.5 * scale}
              width="100%"
              height={0.9 * scale}
              fill="currentColor"
              opacity="0.55"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------
   Section ayracı — ortada kısa meander bloğu, iki yanda ince çizgi
   --------------------------------------------------------------- */

export function Divider({
  className = "",
  tone = "gold",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-5 ${toneMap[tone]} ${className}`}
      aria-hidden="true"
    >
      <span className="h-px w-16 bg-current opacity-45 sm:w-24" />
      <svg width="70" height="18" viewBox="0 0 66 18" fill="none" className="shrink-0">
        <path d="M0 15h66" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" opacity="0.9" fill="none">
          <path d="M3.5 15V4h15v8H9V8h5" />
          <path d="M25.5 15V4h15v8H31V8h5" />
          <path d="M47.5 15V4h15v8H53V8h5" />
        </g>
      </svg>
      <span className="h-px w-16 bg-current opacity-45 sm:w-24" />
    </div>
  );
}

/* ---------------------------------------------------------------
   Amblem — meander halkası içinde F monogramı
   --------------------------------------------------------------- */

export function Crest({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* meander kare çerçeve */}
      <g stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.85">
        <rect x="4" y="4" width="56" height="56" />
        <path d="M11 53V11h42v42z" strokeWidth="1" opacity="0.55" />
      </g>
      {/* köşe meander uçları */}
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" fill="none" opacity="0.7">
        <path d="M4 18V4h14" />
        <path d="M60 18V4H46" />
        <path d="M4 46v14h14" />
        <path d="M60 46v14H46" />
      </g>
      <path d="M25 21h16v3.6h-11.7v8.2h10.2v3.6H29.3V45H25z" fill="currentColor" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   Kemerli amblem — meander tabanlı, footer / hikaye
   --------------------------------------------------------------- */

export function ArchEmblem({
  className = "",
  caption = "Kuruluş 1959",
}: {
  className?: string;
  caption?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 132" fill="none" className="w-full max-w-[210px]">
        <path
          d="M30 130V72a70 70 0 0 1 140 0v58"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.7"
        />
        <path
          d="M39 130V72a61 61 0 0 1 122 0v58"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.32"
        />
        {/* meander taban şeridi */}
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" fill="none" opacity="0.8">
          <path d="M30 130h140" />
          <path d="M38 130v-9h12v6h-8" />
          <path d="M60 130v-9h12v6h-8" />
          <path d="M82 130v-9h12v6h-8" />
          <path d="M104 130v-9h12v6h-8" />
          <path d="M126 130v-9h12v6h-8" />
          <path d="M148 130v-9h12v6h-8" />
        </g>
        <path d="M100 28 104.4 34 100 40 95.6 34z" fill="currentColor" opacity="0.85" />
        <text
          x="100"
          y="96"
          textAnchor="middle"
          className="fill-current font-serif"
          style={{ fontSize: 34, letterSpacing: 3 }}
        >
          1959
        </text>
      </svg>
      {caption ? (
        <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.34em] opacity-75">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------
   Motif alanı — meander karelerinden oluşan ince yüzey dokusu
   --------------------------------------------------------------- */

export function MotifField({
  className = "",
  id = "field",
  scale = 1.5,
}: {
  className?: string;
  id?: string;
  scale?: number;
}) {
  const patternId = `meander-field-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = 64 * scale;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          patternTransform={`scale(${scale})`}
        >
          <g
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            fill="none"
            opacity="0.55"
          >
            {/* kapalı meander karesi */}
            <path d="M12 52V12h40v40z" />
            <path d="M20 44V20h24v24z" strokeWidth="1" opacity="0.6" />
            <path d="M28 36v-8h8" strokeWidth="1.2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/* ---------------------------------------------------------------
   Kart köşesi — meander köşe ucu
   --------------------------------------------------------------- */

export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" fill="none">
        <path d="M0 30V2h28" opacity="0.9" />
        <path d="M7 30V9h21" opacity="0.5" />
        <path d="M14 24v-8h8" opacity="0.7" />
      </g>
    </svg>
  );
}

/** Geriye dönük uyumluluk. */
export function MotifBand({ className = "" }: { className?: string }) {
  return <OrnamentBand className={className} tone="gold" scale={0.85} id="legacy" />;
}
