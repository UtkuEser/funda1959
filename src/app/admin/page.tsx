import { refreshInventory } from "@/lib/inventory/server-init";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import "@/lib/campaigns/server-init";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listBranches, getBranch, isBranchOpenAt, type Weekday } from "@/lib/branch";
import { weekdayOfISO } from "@/lib/time/istanbul";
import { slotLabel, slotsForBranchDate } from "@/lib/delivery/slots";
import { getDeliveryZoneRepository } from "@/lib/delivery/zones";
import { getOrderRepository } from "@/lib/orders";
import { orderStatusLabel } from "@/lib/order-status";
import { formatTL } from "@/lib/cart-utils";
import { getBranchStockView } from "@/lib/inventory/stock-view";
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
import { isSectionAllowed } from "@/lib/admin/section-access";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Props = {
  searchParams: Promise<{ branch?: string; section?: string; date?: string }>;
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

  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayISO();

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
      {section === "orders" && <OrdersSection scope={scope} />}
      {section === "stock" && (
        <StockSection scope={scope} branchId={scopedBranchId} readFailed={!inventoryReadOk} />
      )}
      {section === "campaigns" && <CampaignsSection scope={scope} />}
      {section === "instagram" && <InstagramContentSection />}
      {section === "funda-puan" && <FundaPointsSection scope={scope} />}
      {section === "zones" && <ZonesSection scope={scope} />}
      {section === "slots" && <SlotsSection branchId={scopedBranchId} date={date} />}
      {section === "branches" && <BranchesSection date={date} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function OverviewSection({ scope, date }: { scope: AdminScope; date: string }) {
  const orders = getOrderRepository().list(repoScope(scope));
  const branches = listBranches(repoScope(scope));

  const today = orders.filter((o) => o.deliveryDate === date);
  const count = (s: string) => orders.filter((o) => o.orderStatus === s).length;
  const wd = new Date(`${date}T12:00:00`).getDay() as Weekday;

  return (
    <>
      <PageIntro>
        Bugün {date}. Salt-okunur önizleme; her sorgu <code>authorizedBranchIds</code> ile sınırlanır.
        {isSupabaseConfigured() && " Sipariş sayıları henüz veritabanından okunmuyor."}
      </PageIntro>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bugün Teslimat" value={today.length} />
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
                  <EmptyRow cols={5}>Henüz sipariş yok.</EmptyRow>
                )}
                {orders.slice(0, 6).map((o) => (
                  <Row key={o.orderNumber}>
                    <Td className="font-medium">
                      <Link href={`/siparis-takip?order=${o.orderNumber}`} className="underline underline-offset-2">
                        {o.orderNumber}
                      </Link>
                      {o.isDemo && <span className="ml-1.5"><Badge>Demo</Badge></span>}
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

    </>
  );
}

/* -------------------------------------------------------------------------- */

function OrdersSection({ scope }: { scope: AdminScope }) {
  const orders = getOrderRepository().list(repoScope(scope));
  return (
    <>
      <PageIntro>
        {isSupabaseConfigured()
          ? "Veritabanına kaydedilen siparişler bu ekranda henüz listelenmiyor; liste yalnızca bu sunucu oturumundaki yerel kayıtları gösterir."
          : "Bu sunucu oturumunda oluşturulan siparişler (mock store). En yeni üstte."}
      </PageIntro>
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
                    {o.isDemo && <span className="ml-1.5"><Badge>Demo</Badge></span>}
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

function FundaPointsSection({ scope }: { scope: AdminScope }) {
  // Reachable only for SUPER_ADMIN — see the section-access guard in AdminPage above.
  // `getFundaPointsOverview`/`listPointAccountsForAdmin` still assert the role
  // themselves (their own domain boundary — see lib/funda-points), so this
  // isn't the only thing standing between a manager and this data.
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
