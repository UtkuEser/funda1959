import "@/lib/campaigns/server-init";
import Link from "next/link";
import { listBranches, getBranch, type Weekday } from "@/lib/branch";
import { dailySlotStates, slotLabel } from "@/lib/delivery/slots";
import { getDeliveryZoneRepository } from "@/lib/delivery/zones";
import { getReservationRepository, reservedSlotUnits } from "@/lib/reservations";
import { getOrderRepository } from "@/lib/orders";
import { catalogProducts } from "@/lib/data";
import { orderStatusLabel } from "@/lib/order-status";
import { formatTL } from "@/lib/cart-utils";
import { getBranchStockRows } from "@/lib/inventory/stock-view";
import { BranchStockManager } from "@/components/admin/BranchStockManager";
import { getCampaignRepository } from "@/lib/campaigns";
import { AdminCampaigns } from "@/components/admin/AdminCampaigns";
import { getInstagramContentRepository } from "@/lib/social";
import { AdminInstagramContent } from "@/components/admin/AdminInstagramContent";
import { getFundaPointsOverview, listPointAccountsForAdmin } from "@/lib/funda-points";
import { AdminFundaPoints } from "@/components/admin/AdminFundaPoints";
import { resolvePublicAsset } from "@/lib/public-asset";
import {
  Panel,
  Table,
  TableWrap,
  Th,
  Td,
  Row,
  EmptyRow,
  Badge,
  Metric,
  PageIntro,
} from "@/components/admin/ui";
import { requireAdminScope, repoScope, type AdminScope } from "@/lib/admin/access";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const productName = (id: string) => catalogProducts.find((p) => p.id === id)?.name ?? id;
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const mmss = (ms: number) => {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
};

type Props = {
  searchParams: Promise<{ branch?: string; section?: string; date?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const scope = await requireAdminScope({ branch: sp.branch });
  const section = sp.section ?? "overview";
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayISO();
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  const branches = listBranches(repoScope(scope));
  const scopedBranchId =
    sp.branch && branches.some((b) => b.id === sp.branch)
      ? sp.branch
      : scope.activeBranchId ?? branches[0]?.id ?? "gop";

  return (
    <>
      {section === "overview" && (
        <OverviewSection scope={scope} date={date} renderedAt={renderedAt} />
      )}
      {section === "orders" && <OrdersSection scope={scope} />}
      {section === "stock" && (
        <StockSection scope={scope} branchId={scopedBranchId} date={date} />
      )}
      {section === "campaigns" && <CampaignsSection scope={scope} />}
      {section === "instagram" && <InstagramContentSection scope={scope} />}
      {section === "funda-puan" && <FundaPointsSection scope={scope} />}
      {section === "zones" && <ZonesSection scope={scope} />}
      {section === "slots" && <SlotsSection branchId={scopedBranchId} date={date} />}
      {section === "reservations" && <ReservationsSection scope={scope} renderedAt={renderedAt} />}
      {section === "branches" && <BranchesSection scope={scope} date={date} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function OverviewSection({
  scope,
  date,
  renderedAt,
}: {
  scope: AdminScope;
  date: string;
  renderedAt: number;
}) {
  const orders = getOrderRepository().list(repoScope(scope));
  const reservations = getReservationRepository()
    .activeHolds()
    .filter((r) => (scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(r.branchId) : true));
  const branches = listBranches(repoScope(scope));

  const today = orders.filter((o) => o.deliveryDate === date);
  const count = (s: string) => orders.filter((o) => o.orderStatus === s).length;
  const wd = new Date(`${date}T12:00:00`).getDay() as Weekday;

  return (
    <>
      <PageIntro>
        Bugün {date}. Salt-okunur önizleme; her sorgu <code>authorizedBranchIds</code> ile sınırlanır.
      </PageIntro>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Bugün Teslimat" value={today.length} />
        <Metric label="Hazırlanıyor" value={count("preparing")} />
        <Metric label="Hazır" value={count("ready")} />
        <Metric label="Teslimatta" value={count("out_for_delivery")} />
        <Metric label="Aktif Rezervasyon" value={reservations.length} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Son Siparişler">
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Sipariş No</Th>
                  <Th>Saat</Th>
                  <Th>Şube</Th>
                  <Th>Tutar</Th>
                  <Th>Durum</Th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <EmptyRow cols={5}>Henüz sipariş yok.</EmptyRow>
                )}
                {orders.slice(0, 6).map((o) => (
                  <Row key={o.orderNumber}>
                    <Td className="font-medium">
                      <Link href={`/siparis-takip?order=${o.orderNumber}`} className="underline underline-offset-2">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>{hhmm(o.createdAt)}</Td>
                    <Td>{getBranch(o.branchId)?.name.replace("Funda 1959 ", "") ?? "—"}</Td>
                    <Td>{formatTL(o.total)}</Td>
                    <Td><Badge>{orderStatusLabel(o.orderStatus)}</Badge></Td>
                  </Row>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>

        <Panel title="Şube Durumu">
          <ul className="divide-y divide-neutral-100">
            {branches.map((b) => {
              const h = b.openingHours[wd];
              return (
                <li key={b.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold">{b.name.replace("Funda 1959 ", "")}</span>
                    <Badge strong={b.active}>{b.active ? "Aktif" : "Pasif"}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Adrese teslim: {b.deliveryEnabled ? "Açık" : "Kapalı"} · Mağazadan: {b.pickupEnabled ? "Açık" : "Kapalı"}
                    {h ? ` · ${h.open}–${h.close}` : " · Bugün kapalı"}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {reservations.length > 0 && (
        <p className="mt-4 text-[11.5px] text-neutral-400">
          {reservations.length} aktif rezervasyon · en yakın bitiş{" "}
          {mmss(Math.min(...reservations.map((r) => r.expiresAt - renderedAt)))}
        </p>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function OrdersSection({ scope }: { scope: AdminScope }) {
  const orders = getOrderRepository().list(repoScope(scope));
  return (
    <>
      <PageIntro>Bu sunucu oturumunda oluşturulan siparişler (mock store). En yeni üstte.</PageIntro>
      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Sipariş No</Th>
                <Th>Saat</Th>
                <Th>Şube</Th>
                <Th>Müşteri</Th>
                <Th>Tür</Th>
                <Th>Teslimat</Th>
                <Th align="right">Tutar</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow cols={8}>
                  Henüz sipariş yok. Funnel: ürün → sepet → checkout → ödeme.
                </EmptyRow>
              )}
              {orders.map((o) => (
                <Row key={o.orderNumber}>
                  <Td className="font-medium">
                    <Link href={`/siparis-takip?order=${o.orderNumber}`} className="underline underline-offset-2">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{hhmm(o.createdAt)}</Td>
                  <Td>{getBranch(o.branchId)?.name.replace("Funda 1959 ", "") ?? "—"}</Td>
                  <Td>{o.customer.fullName}</Td>
                  <Td>{o.fulfillmentType === "pickup" ? "Mağazadan" : "Adrese"}</Td>
                  <Td>{o.deliveryDate} · {o.deliverySlot}</Td>
                  <Td align="right" className="tabular-nums">{formatTL(o.total)}</Td>
                  <Td><Badge>{orderStatusLabel(o.orderStatus)}</Badge></Td>
                </Row>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function StockSection({
  scope,
  branchId,
  date,
}: {
  scope: AdminScope;
  branchId: string;
  date: string;
}) {
  const rows = getBranchStockRows(branchId, date);
  const branch = getBranch(branchId);
  const locked = scope.user.role !== "SUPER_ADMIN";

  return (
    <>
      <PageIntro>
        Günlük stok ve üretim kapasitesi. Değişiklik anında uygunluk motoruna yansır. Şube seçimi
        üst bardan yapılır.
      </PageIntro>
      <BranchStockManager
        key={branchId}
        role={scope.user.role}
        branchId={branchId}
        branchName={branch?.name ?? branchId}
        locked={locked}
        initialRows={rows}
        date={date}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

async function CampaignsSection({ scope }: { scope: AdminScope }) {
  const campaigns = await getCampaignRepository().list();
  const branches = listBranches().map((b) => ({ id: b.id, name: b.name }));
  const canManage = scope.user.role === "SUPER_ADMIN";

  return (
    <>
      <PageIntro>
        Homepage&apos;deki &quot;Aktif Kampanyalar&quot; bölümünü besler. En fazla 4 aktif kampanya, sıra
        (öncelik) artan, başlangıç tarihi azalan şekilde gösterilir.
        {!canManage && " Bu görünüm salt-okunur."}
      </PageIntro>
      <AdminCampaigns initialCampaigns={campaigns} canManage={canManage} branches={branches} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function InstagramContentSection({ scope }: { scope: AdminScope }) {
  if (scope.user.role !== "SUPER_ADMIN") {
    return (
      <PageIntro>
        Bu bölüm sadece merkez yönetim (Super Admin) tarafından yönetilir. Görüntüleme yetkiniz yok.
      </PageIntro>
    );
  }

  const items = getInstagramContentRepository()
    .list()
    .map((i) => ({ ...i, posterPreview: resolvePublicAsset(i.posterImage) }));

  return (
    <>
      <PageIntro>
        Homepage&apos;deki &quot;Funda&apos;dan Kareler&quot; bölümünü besler. Yayında olan ilk 4 içerik,
        sıraya göre gösterilir.
      </PageIntro>
      <AdminInstagramContent initialItems={items} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function FundaPointsSection({ scope }: { scope: AdminScope }) {
  if (scope.user.role !== "SUPER_ADMIN") {
    return (
      <PageIntro>
        Bu bölüm sadece merkez yönetim (Super Admin) tarafından görüntülenebilir. Erişim yetkiniz yok.
      </PageIntro>
    );
  }

  const overview = getFundaPointsOverview(scope.user.role);
  const accounts = listPointAccountsForAdmin(scope.user.role);

  return (
    <>
      <PageIntro>
        Online alışverişlerden kazanılan ve yalnızca online siparişlerde kullanılabilen müşteri
        puanları.
      </PageIntro>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Toplam Puan Bakiyesi" value={overview.totalBalance.toLocaleString("tr-TR")} />
        <Metric label="Toplam Kazanılan" value={overview.totalEarned.toLocaleString("tr-TR")} />
        <Metric label="Toplam Kullanılan" value={overview.totalSpent.toLocaleString("tr-TR")} />
        <Metric label="Puanlı Müşteri Sayısı" value={overview.customersWithPoints} />
      </div>

      <div className="mt-6">
        <AdminFundaPoints initialAccounts={accounts} />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ZonesSection({ scope }: { scope: AdminScope }) {
  const zones = getDeliveryZoneRepository()
    .list()
    .filter((z) => (scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(z.branchId) : true));

  return (
    <>
      <PageIntro>Adrese teslimde mahalle → bölge → şube eşleşmesi.</PageIntro>
      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Bölge</Th>
                <Th>Şube</Th>
                <Th>İlçe</Th>
                <Th>Mahalleler</Th>
                <Th align="right">Teslimat Ücreti</Th>
                <Th align="right">Min. Sepet</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && <EmptyRow cols={7}>Tanımlı bölge yok.</EmptyRow>}
              {zones.map((z) => {
                const shown = z.neighborhoods.slice(0, 2).join(", ");
                const extra = z.neighborhoods.length - 2;
                return (
                  <Row key={z.id}>
                    <Td className="font-medium">{z.name}</Td>
                    <Td>{getBranch(z.branchId)?.name.replace("Funda 1959 ", "")}</Td>
                    <Td>{z.district}</Td>
                    <Td>
                      <span title={z.neighborhoods.join(", ")}>
                        {shown}
                        {extra > 0 && <span className="text-neutral-400"> +{extra}</span>}
                      </span>
                    </Td>
                    <Td align="right" className="tabular-nums">{formatTL(z.deliveryFee)}</Td>
                    <Td align="right" className="tabular-nums">{formatTL(z.minimumOrder)}</Td>
                    <Td><Badge strong={z.active}>{z.active ? "Aktif" : "Pasif"}</Badge></Td>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SlotsSection({ branchId, date }: { branchId: string; date: string }) {
  const branch = getBranch(branchId);
  const states = dailySlotStates(branchId, date, reservedSlotUnits);

  return (
    <>
      <PageIntro>
        {branch?.name ?? branchId} · {date}. Şube seçimi üst bardan yapılır.
      </PageIntro>
      <Panel title={`${branch?.name ?? branchId} — teslimat slotları`}>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Saat</Th>
                <Th align="right">Kapasite</Th>
                <Th align="right">Onaylı</Th>
                <Th align="right">Rezerve</Th>
                <Th align="right">Kalan</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {states.length === 0 && <EmptyRow cols={6}>Bu gün için slot tanımlı değil.</EmptyRow>}
              {states.map((s) => (
                <Row key={s.slotId}>
                  <Td className="font-medium">{slotLabel(s)}</Td>
                  <Td align="right" className="tabular-nums">{s.capacity}</Td>
                  <Td align="right" className="tabular-nums">{s.confirmed}</Td>
                  <Td align="right" className="tabular-nums">{s.reserved}</Td>
                  <Td align="right" className={`tabular-nums ${s.remaining === 0 ? "font-semibold" : ""}`}>
                    {s.remaining}
                  </Td>
                  <Td><Badge strong={s.remaining === 0}>{s.remaining === 0 ? "Dolu" : "Açık"}</Badge></Td>
                </Row>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ReservationsSection({
  scope,
  renderedAt,
}: {
  scope: AdminScope;
  renderedAt: number;
}) {
  const reservations = getReservationRepository()
    .activeHolds()
    .filter((r) => (scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(r.branchId) : true));

  return (
    <>
      <PageIntro>Ödeme sırasında tutulan kapasite (10 dk). Süre dolunca kapasite geri açılır.</PageIntro>
      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Şube</Th>
                <Th>Tarih / Slot</Th>
                <Th>Ürünler</Th>
                <Th align="right">Kalan Süre</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && <EmptyRow cols={6}>Aktif rezervasyon yok.</EmptyRow>}
              {reservations.map((r) => {
                const remaining = r.expiresAt - renderedAt;
                return (
                  <Row key={r.id}>
                    <Td className="font-mono text-[11px] text-neutral-500">{r.id.slice(0, 20)}…</Td>
                    <Td>{getBranch(r.branchId)?.name.replace("Funda 1959 ", "")}</Td>
                    <Td>{r.deliveryDate} · {r.deliverySlotStart}</Td>
                    <Td>{r.items.map((i) => `${productName(i.productId)} ×${i.quantity}`).join(", ")}</Td>
                    <Td align="right" className={`font-mono tabular-nums ${remaining < 120_000 ? "font-bold" : ""}`}>
                      {mmss(remaining)}
                    </Td>
                    <Td><Badge>{r.status === "active" ? "Aktif" : r.status}</Badge></Td>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function BranchesSection({ scope, date }: { scope: AdminScope; date: string }) {
  const branches = listBranches(repoScope(scope));
  const wd = new Date(`${date}T12:00:00`).getDay() as Weekday;

  return (
    <>
      <PageIntro>
        {scope.user.role === "SUPER_ADMIN" ? "Tüm şubeler." : "Yetkili olduğunuz şube."}
      </PageIntro>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => {
          const h = b.openingHours[wd];
          return (
            <div key={b.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold">{b.name.replace("Funda 1959 ", "")}</h3>
                <Badge strong={b.active}>{b.active ? "Aktif" : "Pasif"}</Badge>
              </div>
              <dl className="mt-3 space-y-1.5 text-[12.5px] text-neutral-600">
                <div className="flex justify-between">
                  <dt>Adrese teslim</dt>
                  <dd className="font-medium text-neutral-900">{b.deliveryEnabled ? "Açık" : "Kapalı"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Mağazadan teslim</dt>
                  <dd className="font-medium text-neutral-900">{b.pickupEnabled ? "Açık" : "Kapalı"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Bugün</dt>
                  <dd className="font-medium text-neutral-900">{h ? `${h.open}–${h.close}` : "Kapalı"}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-neutral-100 pt-2 text-[11.5px] text-neutral-400">{b.address}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
