import Link from "next/link";
import { getAccount } from "@/lib/account-service";
import { formatCartDate, formatTL } from "@/lib/cart-utils";
import { StatusBadge } from "./StatusBadge";

function Card({ title, href, linkLabel, children }: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-sand-light p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-sans text-[15px] font-semibold text-espresso">{title}</h2>
        <Link
          href={href}
          className="shrink-0 font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
        >
          {linkLabel}
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="font-sans text-[13px] text-taupe">{label}</span>
      <span className="font-sans text-[13.5px] text-espresso">{value}</span>
    </div>
  );
}

export function AccountDashboard() {
  const { profile, addresses, orders } = getAccount();
  const lastOrder = orders[0];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const profileComplete = Boolean(profile.fullName && profile.phone && profile.email);

  return (
    <div className="space-y-4">
      {/* Son Sipariş */}
      <Card title="Son Sipariş" href="/hesabim/siparislerim" linkLabel="Tüm siparişler →">
        {lastOrder ? (
          <div>
            <Row label="Sipariş No" value={<span className="font-medium">{lastOrder.orderNumber}</span>} />
            <Row label="Durum" value={<StatusBadge status={lastOrder.status} />} />
            <Row label="Tarih" value={formatCartDate(lastOrder.createdAt)} />
            <Row label="Toplam" value={<span className="font-semibold text-burgundy">{formatTL(lastOrder.total)}</span>} />
            <Link
              href={`/hesabim/siparislerim/${encodeURIComponent(lastOrder.orderNumber)}`}
              className="mt-3 inline-flex font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
            >
              Sipariş Detayı →
            </Link>
          </div>
        ) : (
          <p className="font-sans text-[13.5px] text-warm-brown">Henüz siparişiniz yok.</p>
        )}
      </Card>

      {/* Kayıtlı Adresler */}
      <Card title="Kayıtlı Adresler" href="/hesabim/adreslerim" linkLabel="Adresleri yönet →">
        {defaultAddress ? (
          <div className="font-sans text-[13.5px] leading-relaxed text-warm-brown">
            <p className="font-medium text-espresso">{defaultAddress.label}</p>
            <p>
              {defaultAddress.district} / {defaultAddress.neighborhood}
            </p>
            <p className="text-taupe">{defaultAddress.addressLine}</p>
          </div>
        ) : (
          <p className="font-sans text-[13.5px] text-warm-brown">Henüz kayıtlı adresiniz yok.</p>
        )}
      </Card>

      {/* Profil Bilgileri */}
      <Card title="Profil Bilgileri" href="/hesabim/profil" linkLabel="Profili düzenle →">
        {profileComplete ? (
          <div className="font-sans text-[13.5px] leading-relaxed text-warm-brown">
            <p className="text-espresso">{profile.fullName}</p>
            <p>{profile.phone}</p>
            <p>{profile.email}</p>
          </div>
        ) : (
          <p className="font-sans text-[13.5px] text-warm-brown">
            Profil bilgileriniz henüz eksik. Siparişlerinizi hızlandırmak için tamamlayabilirsiniz.
          </p>
        )}
      </Card>
    </div>
  );
}
