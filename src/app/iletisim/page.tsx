import type { Metadata } from "next";
import { branches } from "@/lib/data";
import { FadeIn } from "@/components/shared/FadeIn";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Funda 1959 ile iletişime geçin. Özel gün sipariş, genel bilgi ve şube iletişim bilgileri. GOP, Panora ve İncek TONA şubelerimiz.",
  keywords: [
    "Funda 1959 iletişim",
    "Funda pastane telefon",
    "Ankara pastane sipariş",
    "özel pasta sipariş Ankara",
  ],
};

export default function IletisimPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-32 pb-16 md:pt-44 md:pb-20"
        style={{
          background: "linear-gradient(160deg, #EDE5D8 0%, #F5F0E8 60%, #FAF8F3 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-4 font-semibold">
              İletişim
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-chocolate leading-tight mb-5">
              Bizimle iletişime geçin
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-base md:text-lg text-warm-brown max-w-2xl mx-auto leading-relaxed">
              Özel gün siparişleriniz, genel sorularınız veya şubelerimiz hakkında bilgi almak için bize ulaşın.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main content */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Form */}
            <div>
              <FadeIn>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-chocolate mb-2">
                  Mesaj Gönderin
                </h2>
                <p className="font-sans text-sm text-mocha mb-8">
                  Sipariş talepleriniz veya sorularınız için formu doldurun, en kısa sürede dönüş yapalım.
                </p>
              </FadeIn>

              <FadeIn delay={100}>
                <form className="space-y-5" action="#" method="POST">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block font-sans text-sm font-medium text-chocolate mb-1.5"
                      >
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Adınız Soyadınız"
                        className="w-full px-4 py-3 bg-cream-light border border-sand text-espresso font-sans text-sm rounded-xl placeholder:text-mocha/50 focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block font-sans text-sm font-medium text-chocolate mb-1.5"
                      >
                        Telefon
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="05xx xxx xx xx"
                        className="w-full px-4 py-3 bg-cream-light border border-sand text-espresso font-sans text-sm rounded-xl placeholder:text-mocha/50 focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-sans text-sm font-medium text-chocolate mb-1.5"
                    >
                      E-posta
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="ornek@email.com"
                      className="w-full px-4 py-3 bg-cream-light border border-sand text-espresso font-sans text-sm rounded-xl placeholder:text-mocha/50 focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block font-sans text-sm font-medium text-chocolate mb-1.5"
                    >
                      Konu
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      className="w-full px-4 py-3 bg-cream-light border border-sand text-espresso font-sans text-sm rounded-xl focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Konu seçin...</option>
                      <option value="ozel-gun">Özel Gün Sipariş</option>
                      <option value="kurumsal">Kurumsal Sipariş</option>
                      <option value="genel">Genel Bilgi</option>
                      <option value="sikayet">Şikayet / Geri Bildirim</option>
                      <option value="diger">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block font-sans text-sm font-medium text-chocolate mb-1.5"
                    >
                      Mesajınız
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Mesajınızı yazın... Özel gün siparişleri için pasta türü, boyutu, tarihi ve varsa özel isteklerinizi belirtin."
                      className="w-full px-4 py-3 bg-cream-light border border-sand text-espresso font-sans text-sm rounded-xl placeholder:text-mocha/50 focus:outline-none focus:border-gold transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-chocolate text-cream-light font-sans font-semibold text-sm rounded-xl hover:bg-chocolate-light transition-colors duration-200"
                  >
                    Mesajı Gönder
                  </button>

                  <p className="font-sans text-xs text-mocha text-center">
                    Mesajınıza en kısa sürede, genellikle 24 saat içinde dönüş yaparız.
                  </p>
                </form>
              </FadeIn>
            </div>

            {/* Branches contact */}
            <div>
              <FadeIn delay={100}>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-chocolate mb-2">
                  Doğrudan Ulaşın
                </h2>
                <p className="font-sans text-sm text-mocha mb-8">
                  Şubelerimizi arayarak hızlı sipariş alabilir ve bilgi alabilirsiniz.
                </p>
              </FadeIn>

              <div className="space-y-4">
                {branches.map((branch, index) => (
                  <FadeIn
                    key={branch.id}
                    delay={([100, 200, 300] as const)[index]}
                  >
                    <div className="bg-cream-light border border-sand-light rounded-2xl p-5 hover:border-gold/30 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-serif text-base font-semibold text-chocolate">
                            {branch.name}
                          </h3>
                          <p className="font-sans text-xs text-mocha mt-0.5">
                            {branch.neighborhood}
                          </p>
                        </div>
                        <span className="font-sans text-xs text-mocha bg-cream px-2.5 py-1 rounded-full border border-sand-light whitespace-nowrap">
                          Açık
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="font-sans text-xs text-warm-brown">{branch.address}</p>
                        <p className="font-sans text-xs text-warm-brown">{branch.hours}</p>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`tel:${branch.phone.replace(/\s/g, "")}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-chocolate text-cream-light text-xs font-sans font-semibold rounded-xl hover:bg-chocolate-light transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {branch.phone}
                        </a>
                        <a
                          href={branch.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-2.5 border border-sand text-warm-brown text-xs font-sans font-semibold rounded-xl hover:border-chocolate hover:text-chocolate transition-all"
                        >
                          Yol Tarifi
                        </a>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Social */}
              <FadeIn delay={400}>
                <div className="mt-6 bg-cream-light border border-sand-light rounded-2xl p-5">
                  <h3 className="font-serif text-base font-semibold text-chocolate mb-3">
                    Sosyal Medya
                  </h3>
                  <a
                    href="https://instagram.com/funda.1959"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8D5C5] to-[#D4B896] flex items-center justify-center">
                      <svg className="w-5 h-5 text-warm-brown" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-sans text-sm font-semibold text-chocolate group-hover:text-warm-brown transition-colors">
                        @funda.1959
                      </p>
                      <p className="font-sans text-xs text-mocha">Instagram</p>
                    </div>
                  </a>

                  <div className="mt-4 pt-4 border-t border-sand-light">
                    <a
                      href="mailto:info@funda1959.com"
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8D5C5] to-[#D4B896] flex items-center justify-center">
                        <svg className="w-5 h-5 text-warm-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-chocolate group-hover:text-warm-brown transition-colors">
                          info@funda1959.com
                        </p>
                        <p className="font-sans text-xs text-mocha">E-posta</p>
                      </div>
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
