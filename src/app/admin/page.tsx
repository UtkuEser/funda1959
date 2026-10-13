import { refreshInventory } from "@/lib/inventory/server-init";
import "@/lib/campaigns/server-init";
import "@/lib/orders/server-init";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listBranches, getBranch, isBranchOpenAt, type Weekday } from "@/lib/branch";
import { istanbulDateISO, weekdayOfISO } from "@/lib/time/istanbul";
import { slotLabel, slotsForBranchDate } from "@/lib/delivery/slots";
import { getDeliveryZoneRepository } from "@/lib/delivery/zones";
import { readDeliveryFeeRecords, type ZoneFeeRecord } from "@/lib/delivery/fees";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { MIN_DELIVERY_ORDER_TL } from "@/lib/order-rules";
import { ZoneFeesTable, type ZoneFeeRow } from "@/components/admin/ZoneFeesTable";
import { catalogProducts, productSizes } from "@/lib/data";
import {
  catalogPriceSuffix,
  productPriceTableMissing,
  readProductPriceRecords,
  type ProductPriceRecord,
} from "@/lib/pricing/prices";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { ProductPricesTable, type ProductPriceProduct } from "@/components/admin/ProductPricesTable";
import { getOrderRepository, type OrderPage, type StoredOrder } from "@/lib/orders";
import { orderStatusLabel } from "@/lib/order-status";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { formatTL } from "@/lib/cart-utils";
import { getBranchStockView } from "@/lib/inventory/stock-view";
import { BranchStockManager } from "@/components/admin/BranchStockManager";
import { getCampaignRepository } from "@/lib/campaigns";
import { AdminCampaigns } from "@/components/admin/AdminCampaigns";
import { getInstagramContentRepository } from "@/lib/social";
import { AdminInstagramContent } from "@/components/admin/AdminInstagramContent";
import { getFundaPointsAdminPage } from "@/lib/funda-points/service";
import { FundaPointsNotReadyError } from "@/lib/funda-points/store";
import { isFundaPointsActive } from "@/lib/funda-points";
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
import { dayTime } from "@/lib/admin/format";
import { isSectionAllowed } from "@/lib/admin/section-access";

export const dynamic = "force-dynamic";

// every date and time on the panel is Europe/Istanbul, whatever the server's zone
const todayISO = () => istanbulDateISO();
const isISODate = (v: string | undefined): v is string => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

type Props = {
  searchParams: Promise<{ branch?: string; section?: string; date?: string; from?: string; to?: string; page?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const scope = await requireAdminScope({ branch: sp.branch });
  const section = sp.section ?? "overview";

  // Single source of truth (see section-access.ts) — a BRANCH_MANAGER can
  // never reach a SUPER_ADMIN-only section's content, not even by typing
  // the URL directly. No per-section duplicate of this check below.
  if (!isSectionAllowed(scope.user.role, section)) {
    redirect("/admin");
  }

  const date = isISODate(sp.date) ? sp.date : todayISO();

  // saved branch stock statuses (database in production) before any section reads availability
  const inventoryReadOk = await refreshInventory({ strict: true }).then(
    () => true,
    () => false,
  );

  const branches = listBranches(repoScope(scope));
  const scopedBranchId =
    sp.branch && branches.some((b) => b.id === sp.branch)
      ? sp.branch
      : scope.activeBranchId ?? branches[0]?.id ?? "gop";

  return (
    <>
      {section === "overview" && (
        <OverviewSection scope={scope} date={date} />
      )}
      {section === "orders" && (
        <OrdersSection
          scope={scope}
          from={isISODate(sp.from) ? sp.from : null}
          to={isISODate(sp.to) ? sp.to : null}
          page={Math.max(1, Math.floor(Number(sp.page)) || 1)}
        />
      )}
      {section === "stock" && (
        <StockSection scope={scope} branchId={scopedBranchId} readFailed={!inventoryReadOk} />
      )}
      {section === "campaigns" && <CampaignsSection scope={scope} />}
      {section === "instagram" && <InstagramContentSection />}
      {section === "funda-puan" && <FundaPointsSection scope={scope} />}
      {section === "prices" && <PricesSection />}
      {section === "zones" && <ZonesSection scope={scope} />}
      {section === "slots" && <SlotsSection branchId={scopedBranchId} date={date} />}
      {section === "branches" && <BranchesSection date={date} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */

async function OverviewSection({ scope, date }: { scope: AdminScope; date: string }) {
  const branches = listBranches(repoScope(scope));
  const repo = getOrderRepository();

  // scope comes from the session: a branch account only ever counts its own orders
  let latest: OrderPage | null = null;
  let todayTotal: number | null = null;
  try {
    const [recent, today] = await Promise.all([
      repo.list({ branchIds: scope.authorizedBranchIds, limit: 6, offset: 0 }),
      repo.list({ branchIds: scope.authorizedBranchIds, from: date, to: date, limit: 0, offset: 0 }),
    ]);
    latest = recent;
    todayTotal = today.total;
  } catch (err) {
    console.error("[orders] admin overview read failed", (err as Error).message);
  }
  const orders = latest?.rows ?? [];
  const count = (s: StoredOrder["orderStatus"]) => (latest ? latest.statusCounts[s] ?? 0 : "—");
  const wd = weekdayOfISO(date) as Weekday;

  return (
    <>
      <PageIntro>
        Bugün {date} (İstanbul). Her sorgu oturumdaki şube kapsamıyla sınırlanır.
        {repo.kind === "memory" && " Siparişler bu sunucu oturumunun belleğinden okunuyor (geliştirme)."}
      </PageIntro>
      {!latest && <OrdersReadWarning />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bugün Teslimat" value={todayTotal ?? "—"} />
        <Metric label="Hazırlanıyor" value={count("preparing")} />
        <Metric label="Hazır" value={count("ready")} />
        <Metric label="Teslimatta" value={count("out_for_delivery")} />
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
                  <EmptyRow cols={5}>{latest ? "Henüz sipariş yok." : "Siparişler okunamadı."}</EmptyRow>
                )}
                {orders.map((o) => (
                  <Row key={o.orderNumber}>
                    <Td className="font-medium">
                      <Link href={`/siparis-takip?order=${o.orderNumber}`} className="underline underline-offset-2">
                        {o.orderNumber}
                      </Link>
                      {o.isDemo && <span className="ml-1.5"><Badge>Demo</Badge></span>}
                    </Td>
                    <Td>{dayTime(o.createdAt)}</Td>
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

    </>
  );
}

/* -------------------------------------------------------------------------- */

function OrdersReadWarning() {
  return (
    <p role="alert" className="mb-4 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-800">
      Siparişler şu an okunamadı. Sayfayı biraz sonra yenileyin.
    </p>
  );
}

const ORDERS_PAGE_SIZE = 25;

async function OrdersSection({
  scope,
  from,
  to,
  page,
}: {
  scope: AdminScope;
  from: string | null;
  to: string | null;
  page: number;
}) {
  const repo = getOrderRepository();
  let result: OrderPage | null = null;
  try {
    // branch scope from the session — never from the URL
    result = await repo.list({
      branchIds: scope.authorizedBranchIds,
      from,
      to,
      limit: ORDERS_PAGE_SIZE,
      offset: (page - 1) * ORDERS_PAGE_SIZE,
    });
  } catch (err) {
    console.error("[orders] admin list read failed", (err as Error).message);
  }
  const orders = result?.rows ?? [];
  const pages = result ? Math.max(1, Math.ceil(result.total / ORDERS_PAGE_SIZE)) : 1;
  const pageHref = (p: number) => {
    const q = new URLSearchParams({ section: "orders" });
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (p > 1) q.set("page", String(p));
    return `/admin?${q.toString()}`;
  };

  return (
    <>
      <PageIntro>
        {repo.kind === "supabase"
          ? "Veritabanındaki siparişler, en yeni üstte. Şube hesabı yalnızca kendi şubesinin siparişlerini görür ve değiştirir; Merkez tüm şubeleri."
          : "Bu sunucu oturumunda oluşturulan siparişler (geliştirme, bellekte). En yeni üstte."}{" "}
        Durum bir adım ilerletilir; iptal için gerekçe zorunludur. Teslim edilen sipariş iptal edilmez, iade bu aşamada yok.
      </PageIntro>
      {!result && <OrdersReadWarning />}

      <form method="get" action="/admin" className="mb-4 flex flex-wrap items-end gap-2.5">
        <input type="hidden" name="section" value="orders" />
        <label className="flex flex-col gap-1 text-[11.5px] font-medium text-neutral-600">
          Teslimat tarihi (başlangıç)
          <input type="date" name="from" defaultValue={from ?? ""} className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-[13px] text-neutral-900" />
        </label>
        <label className="flex flex-col gap-1 text-[11.5px] font-medium text-neutral-600">
          Teslimat tarihi (bitiş)
          <input type="date" name="to" defaultValue={to ?? ""} className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-[13px] text-neutral-900" />
        </label>
        <button type="submit" className="min-h-[36px] rounded-md bg-neutral-900 px-3 text-[12.5px] font-semibold text-white hover:bg-neutral-700">
          Filtrele
        </button>
        {(from || to) && (
          <Link href="/admin?section=orders" className="min-h-[36px] content-center rounded-md border border-neutral-300 bg-white px-3 text-[12.5px] font-semibold text-neutral-900 hover:border-neutral-500">
            Temizle
          </Link>
        )}
      </form>

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Sipariş No</Th>
                <Th>Oluşturma</Th>
                <Th>Şube</Th>
                <Th>Müşteri</Th>
                <Th>Tür</Th>
                <Th>Teslimat</Th>
                <Th align="right">Tutar</Th>
                <Th>Durum</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <EmptyRow cols={9}>
                  {!result ? "Siparişler okunamadı." : from || to ? "Bu tarih aralığında sipariş yok." : "Henüz sipariş yok."}
                </EmptyRow>
              )}
              {orders.map((o) => {
                const last = o.statusHistory.at(-1);
                return (
                  <Row key={o.orderNumber}>
                    <Td className="font-medium">
                      <Link href={`/siparis-takip?order=${o.orderNumber}`} className="underline underline-offset-2">
                        {o.orderNumber}
                      </Link>
                      {o.isDemo && <span className="ml-1.5"><Badge>Demo</Badge></span>}
                    </Td>
                    <Td>{dayTime(o.createdAt)}</Td>
                    <Td>{getBranch(o.branchId)?.name.replace("Funda 1959 ", "") ?? "—"}</Td>
                    <Td>{o.customer.fullName}</Td>
                    <Td>{o.fulfillmentType === "pickup" ? "Mağazadan" : "Adrese"}</Td>
                    <Td>{o.deliveryDate} · {o.deliverySlot}</Td>
                    <Td align="right" className="tabular-nums">{formatTL(o.total)}</Td>
                    <Td>
                      <Badge>{orderStatusLabel(o.orderStatus)}</Badge>
                      {o.cancellation ? (
                        <p className="mt-1 max-w-[220px] text-[11.5px] text-neutral-500">
                          {o.cancellation.by} · {dayTime(o.cancellation.at)}
                          <br />
                          Gerekçe: {o.cancellation.reason}
                        </p>
                      ) : (
                        last && (
                          <p className="mt-1 text-[11.5px] text-neutral-500">
                            {last.actorName} · {dayTime(last.at)}
                          </p>
                        )
                      )}
                    </Td>
                    <Td>
                      <OrderStatusActions orderNumber={o.orderNumber} status={o.orderStatus} deliveryType={o.fulfillmentType} />
                    </Td>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
        {result && result.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 text-[12.5px] text-neutral-600">
            <span>
              {result.total} sipariş · sayfa {Math.min(page, pages)} / {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-semibold text-neutral-900 hover:border-neutral-500">
                  ← Önceki
                </Link>
              )}
              {page < pages && (
                <Link href={pageHref(page + 1)} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-semibold text-neutral-900 hover:border-neutral-500">
                  Sonraki →
                </Link>
              )}
            </span>
          </div>
        )}
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function StockSection({
  scope,
  branchId,
  readFailed,
}: {
  scope: AdminScope;
  branchId: string;
  readFailed: boolean;
}) {
  const view = getBranchStockView(branchId);
  const branch = getBranch(branchId);
  const locked = scope.user.role !== "SUPER_ADMIN";

  return (
    <>
      <PageIntro>
        Ürünlerin bu şubedeki uygunluğu. Aktif ürünler bugünden, pasif ürünler en erken yarından teslim
        edilir; müşteri pasif ürünü görmeye ve sipariş vermeye devam eder. Değişiklikler otomatik kaydedilir
        ve yalnızca bu şubeyi etkiler.
      </PageIntro>
      {readFailed && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
          Kayıtlı stok durumları şu an okunamadı; aşağıdaki durumlar güncel olmayabilir. Sayfayı yenileyin.
        </p>
      )}
      <BranchStockManager
        key={branchId}
        branchId={branchId}
        branchName={branch?.name ?? branchId}
        locked={locked}
        initialRows={view.rows}
        notCarried={view.notCarried}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

async function CampaignsSection({ scope }: { scope: AdminScope }) {
  const branches = listBranches().map((b) => ({ id: b.id, name: b.name }));
  const canManage = scope.user.role === "SUPER_ADMIN";
  let campaigns: Awaited<ReturnType<ReturnType<typeof getCampaignRepository>["list"]>>;
  try {
    campaigns = await getCampaignRepository().list();
  } catch (err) {
    console.error("[campaigns] admin read failed", (err as Error).message);
    return (
      <>
        <PageIntro>Homepage&apos;deki kampanya bölümünü besler.</PageIntro>
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
          Kampanyalar şu an veritabanından okunamadı. Sayfayı yenileyin; sorun sürerse teknik ekibe bildirin.
        </p>
      </>
    );
  }

  return (
    <>
      <PageIntro>
        Homepage&apos;deki kampanya bölümünü besler. Aktif kampanyalar sıra (öncelik) artan, başlangıç tarihi
        azalan şekilde gösterilir.
        {!canManage && " Bu görünüm salt-okunur."}
      </PageIntro>
      <AdminCampaigns initialCampaigns={campaigns} canManage={canManage} branches={branches} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function InstagramContentSection() {
  // Reachable only for SUPER_ADMIN — see the section-access guard in AdminPage above.
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

async function FundaPointsSection({ scope }: { scope: AdminScope }) {
  // Reachable only for SUPER_ADMIN — see the section-access guard in AdminPage above.
  // getFundaPointsAdminPage asserts the role itself (lib/funda-points/service), and
  // the database refuses any correction not signed by "merkez".
  let page: Awaited<ReturnType<typeof getFundaPointsAdminPage>>;
  try {
    page = await getFundaPointsAdminPage(scope.user.role, { limit: 200 });
  } catch (err) {
    const notReady = err instanceof FundaPointsNotReadyError;
    if (!notReady) console.error("[admin] Funda Puan could not be read", { error: (err as Error).message });
    return (
      <>
        <PageIntro>Online alışverişlerden kazanılan ve yalnızca online siparişlerde kullanılabilen üye puanları.</PageIntro>
        <Panel>
          <p className="p-4 text-[13px] text-neutral-600">
            {notReady
              ? "Funda Puan tabloları bu projede henüz kurulmadı (migration 0011)."
              : "Funda Puan bilgileri şu an okunamadı. Lütfen biraz sonra tekrar deneyin."}
          </p>
        </Panel>
      </>
    );
  }
  const { overview, rows, total } = page;

  return (
    <>
      <PageIntro>
        Online alışverişlerden kazanılan ve yalnızca online siparişlerde kullanılabilen üye puanları: ödeme onaylanınca
        ürün tutarının %10&apos;u, her kazanım 1 yıl geçerli, 1 puan = 1 TL.
      </PageIntro>
      {!isFundaPointsActive() && (
        <p className="mb-4 rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-700">
          Puan kazanımı ve kullanımı ödeme entegrasyonu tamamlanana kadar kapalı. Merkez düzeltmeleri kaydedilir; üyeler
          bakiyelerini Hesabım&apos;da görür.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Kullanılabilir Puan" value={overview.available.toLocaleString("tr-TR")} />
        <Metric label="Toplam Kazanılan" value={overview.earned.toLocaleString("tr-TR")} />
        <Metric label="Toplam Kullanılan" value={overview.spent.toLocaleString("tr-TR")} />
        <Metric label="Puanı Olan Üye" value={overview.membersWithPoints} />
      </div>
      {overview.debt > 0 && (
        <p className="mt-2 text-[12px] text-neutral-500">
          İptallerden doğan puan borcu: {overview.debt.toLocaleString("tr-TR")} (sonraki kazanımlardan düşülür).
        </p>
      )}

      <div className="mt-6">
        <AdminFundaPoints initialRows={rows} total={total} />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

async function ZonesSection({ scope }: { scope: AdminScope }) {
  const zones = getDeliveryZoneRepository()
    .list()
    .filter((z) => (scope.authorizedBranchIds ? scope.authorizedBranchIds.includes(z.branchId) : true));

  // D15: fees from Supabase; unreadable -> say so, never show older values
  let records: ZoneFeeRecord[] | null = null;
  try {
    await refreshDeliveryFees({ strict: true });
    records = readDeliveryFeeRecords();
  } catch {
    records = null;
  }
  const canEdit = scope.user.role === "SUPER_ADMIN" && records !== null;
  // the table is a client component fed plain rows: a save updates its row from
  // the database's answer, and the page stays small to navigate to
  const zoneRows: ZoneFeeRow[] = zones.map((z) => ({
    id: z.id,
    name: z.name,
    branchName: getBranch(z.branchId)?.name.replace("Funda 1959 ", "") ?? z.branchId,
    district: z.district,
    neighborhoods: z.neighborhoods,
    active: z.active,
    fee: records?.find((r) => r.zoneId === z.id) ?? null,
  }));

  return (
    <>
      <PageIntro>
        Adrese teslimde mahalle → bölge → şube eşleşmesi. <strong>Bölge ve mahalle listeleri test amaçlıdır; onaylanmış hizmet
        kapsamı değildir.</strong> Teslimat ücretlerini yalnızca Merkez Yönetim değiştirir; şubeler kendi bölgelerini salt okunur
        görür. Ücreti belirlenmeyen bölgeye adrese teslim yapılmaz; gel-al çalışır. Adrese teslimde minimum sipariş{" "}
        {formatTL(MIN_DELIVERY_ORDER_TL)} (ürün toplamı − indirim; teslimat ücreti hariç; gel-al hariç).
      </PageIntro>
      {records === null && (
        <p role="alert" className="mb-4 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-800">
          Teslimat bilgisi şu an alınamıyor. Ücretler gösterilmiyor ve değiştirilemiyor; adrese teslim siparişleri bu sırada alınmaz.
        </p>
      )}
      <ZoneFeesTable rows={zoneRows} readable={records !== null} canEdit={canEdit} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** D5: Merkez changes the prices of existing products — nothing else about them. */
async function PricesSection() {
  let records: ProductPriceRecord[] | null = null;
  try {
    await refreshProductPrices({ strict: true });
    records = readProductPriceRecords();
  } catch {
    records = null;
  }
  const tableMissing = records !== null && productPriceTableMissing();
  const canEdit = records !== null && !tableMissing;
  const stored = new Map((records ?? []).map((r) => [`${r.productId}|${r.variantKey}`, r]));
  // plain data for the client table (see ZonesSection): one entry per product
  // with its single price, or with each of its sizes (D20)
  const priceProducts = catalogProducts.map((p): ProductPriceProduct => {
    const sizes = productSizes(p);
    return {
      productId: p.id,
      name: p.name,
      category: p.categoryName,
      unit: sizes.length > 0 ? "" : catalogPriceSuffix(p),
      prices:
        sizes.length > 0
          ? sizes.map((v) => ({ variantKey: v.id, size: v.label, catalogPrice: v.price, oldPrice: v.oldPrice ?? null, stored: stored.get(`${p.id}|${v.id}`) ?? null }))
          : [{ variantKey: "", size: null, catalogPrice: p.priceValue, oldPrice: p.oldPrice ?? null, stored: stored.get(`${p.id}|`) ?? null }],
    };
  });

  return (
    <>
      <PageIntro>
        Mevcut ürünlerin fiyatları. Ürün ekleme, silme, görsel ve içerik bu ekrandan değişmez; şube stokları (aktif/pasif) ayrı
        yönetilir. Kaydedilen fiyat katalogda, ürün sayfasında, aramada, hızlı siparişte, sepette ve ödeme hesabında hemen geçerli olur;
        verilmiş siparişlerin fiyatları değişmez. Fiyatı kaydedilmemiş ürün veya boyut katalog fiyatıyla satılır.{" "}
        <strong>Boyutlu ürünlerde ürün adına veya oka tıklayınca boyutlar açılır; her boyutun fiyatı ayrı girilir ve ayrı kaydedilir,
        bir boyutu değiştirmek diğerlerini değiştirmez.</strong> Kartta en küçük boyutun fiyatı görünür. Üstü çizili eski fiyat
        yalnızca belirlenmiş ürün veya boyutta ve güncel fiyattan yüksekken görünür; fiyat değişince kendiliğinden oluşmaz.
      </PageIntro>
      {records === null && (
        <p role="alert" className="mb-4 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-800">
          Fiyat bilgisi şu an alınamıyor. Fiyatlar değiştirilemiyor; ödeme hesabı ve sipariş bu sırada alınmaz.
        </p>
      )}
      {tableMissing && (
        <p role="alert" className="mb-4 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-800">
          Fiyat tablosu henüz kurulmadı (migration 0009). Bütün ürünler katalog fiyatıyla satılıyor; fiyat değiştirilemez.
        </p>
      )}
      <ProductPricesTable products={priceProducts} readable={records !== null} canEdit={canEdit} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SlotsSection({ branchId, date }: { branchId: string; date: string }) {
  const branch = getBranch(branchId);
  const windows = slotsForBranchDate(branchId, date);
  const wd = weekdayOfISO(date) as Weekday;

  return (
    <>
      <PageIntro>
        {branch?.name ?? branchId} · {date}. Şube seçimi üst bardan yapılır. Saatlik sipariş sınırı
        uygulanmaz; bir aralık yalnızca çalışma saati, hazırlık süresi ve şubede pasif ürün kuralıyla kapanır.
      </PageIntro>
      <Panel title={`${branch?.name ?? branchId} — teslimat aralıkları`}>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Saat</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {windows.length === 0 && <EmptyRow cols={2}>Bu gün için teslimat aralığı tanımlı değil.</EmptyRow>}
              {windows.map((w) => {
                const open = branch ? isBranchOpenAt(branch, wd, w.startTime) : false;
                return (
                  <Row key={w.id}>
                    <Td className="font-medium">{slotLabel(w)}</Td>
                    <Td><Badge strong={!open}>{open ? "Açık" : "Çalışma saati dışında"}</Badge></Td>
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


function BranchesSection({ date }: { date: string }) {
  // Reachable only for SUPER_ADMIN — see the section-access guard in AdminPage above.
  const branches = listBranches();
  const wd = new Date(`${date}T12:00:00`).getDay() as Weekday;

  return (
    <>
      <PageIntro>Tüm şubeler.</PageIntro>
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
