import Link from "next/link";
import {
  FUNDA_POINT_TRANSACTION_LABEL_TR,
  FUNDA_POINTS_EARN_RATE_PERCENT_DISPLAY,
  FUNDA_POINTS_RULES,
  type FundaPointsSummary,
} from "@/lib/funda-points";
import { istanbulDateISO } from "@/lib/time/istanbul";
import { formatCartDate } from "@/lib/cart-utils";

const fmt = (n: number) => n.toLocaleString("tr-TR");
const signed = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;
/** "13 Ekim 2027" — Istanbul calendar day */
const day = (iso: string) => formatCartDate(istanbulDateISO(new Date(iso)));

/**
 * The member's own Funda Puan: spendable balance, debt (if a cancelled
 * order's points had already been spent), lots with their expiry, history.
 * While earning and spending are off (D41) it says so first — the balance
 * shown is the real one, not a promise.
 */
export function PointsView({ summary, active }: { summary: FundaPointsSummary; active: boolean }) {
  const next = summary.lots[0];
  return (
    <div className="space-y-6">
      {!active && (
        <p role="status" className="rounded-md border border-sand-light bg-cream-light px-4 py-3 font-sans text-[13.5px] leading-relaxed text-warm-brown">
          Funda Puan henüz etkin değil. Online ödeme açıldığında, ödemesi onaylanan siparişlerinizden puan kazanmaya ve
          puanlarınızı kullanmaya başlayabileceksiniz. Şu an puan kazanılmaz ve kullanılamaz.
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-sand-light p-5">
          <p className="font-sans text-[13px] text-taupe">Kullanılabilir Puan</p>
          <p className="mt-1 font-serif text-[30px] font-semibold text-burgundy">{fmt(summary.available)}</p>
          <p className="font-sans text-[12.5px] text-taupe">
            {FUNDA_POINTS_RULES.pointValueTL} puan = {FUNDA_POINTS_RULES.pointValueTL} TL · yalnızca online siparişlerde, ürün tutarında
          </p>
        </div>
        <div className="rounded-lg border border-sand-light p-5">
          <p className="font-sans text-[13px] text-taupe">Süresi en yakın puanlar</p>
          {next ? (
            <>
              <p className="mt-1 font-serif text-[22px] font-semibold text-espresso">{fmt(next.remaining)} puan</p>
              <p className="font-sans text-[12.5px] text-taupe">{day(next.expiresAt)} tarihine kadar geçerli</p>
            </>
          ) : (
            <p className="mt-2 font-sans text-[13.5px] text-warm-brown">Kullanılabilir puanınız yok.</p>
          )}
        </div>
      </section>

      {summary.debt > 0 && (
        <p className="rounded-md border border-sand-light px-4 py-3 font-sans text-[13px] leading-relaxed text-warm-brown">
          İptal edilen bir siparişten kazandığınız {fmt(summary.debt)} puanı daha önce kullanmıştınız. Bu tutar sonraki
          kazanımlarınızdan düşülecek; kullanılabilir puanınız sıfırın altına inmez.
        </p>
      )}

      <section>
        <h2 className="font-sans text-[15px] font-semibold text-espresso">Puanlarım ve son kullanma tarihleri</h2>
        {summary.lots.length === 0 ? (
          <p className="mt-2 font-sans text-[13.5px] text-warm-brown">Henüz kullanılabilir puanınız yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-light rounded-lg border border-sand-light">
            {summary.lots.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <span className="font-sans text-[13.5px] text-espresso">
                  {fmt(l.remaining)} puan
                  <span className="text-taupe">
                    {" "}
                    · {l.source === "admin" ? "Funda düzeltmesi" : l.orderNumber ? `${l.orderNumber} siparişinden` : "Sipariş kazanımı"}
                  </span>
                </span>
                <span className="font-sans text-[12.5px] text-taupe">Son kullanma: {day(l.expiresAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-sans text-[15px] font-semibold text-espresso">Puan hareketleri</h2>
        {summary.transactions.length === 0 ? (
          <p className="mt-2 font-sans text-[13.5px] text-warm-brown">Henüz puan hareketiniz yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-light rounded-lg border border-sand-light">
            {summary.transactions.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-sans text-[13.5px] text-espresso">{FUNDA_POINT_TRANSACTION_LABEL_TR[t.type]}</p>
                  <p className="font-sans text-[12px] text-taupe">
                    {day(t.createdAt)}
                    {t.orderNumber && (
                      <>
                        {" · "}
                        <Link href={`/hesabim/siparislerim/${encodeURIComponent(t.orderNumber)}`} className="underline hover:text-burgundy">
                          {t.orderNumber}
                        </Link>
                      </>
                    )}
                    {t.expiredPoints > 0 && ` · ${fmt(t.expiredPoints)} puanın süresi dolduğu için iade edilemedi`}
                  </p>
                </div>
                <span className={`font-sans text-[14px] font-semibold tabular-nums ${t.points < 0 ? "text-warm-brown" : "text-burgundy"}`}>
                  {signed(t.points)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="font-sans text-[12px] leading-relaxed text-taupe">
        Ödemesi onaylanan online siparişlerde, indirim ve kullanılan puan düşüldükten sonra kalan ürün tutarının %
        {FUNDA_POINTS_EARN_RATE_PERCENT_DISPLAY}&apos;u kadar puan kazanılır; teslimat ücreti hariçtir. Her kazanım{" "}
        {FUNDA_POINTS_RULES.lotValidityLabel} geçerlidir ve önce süresi en yakın puanlar kullanılır.
      </p>
    </div>
  );
}
