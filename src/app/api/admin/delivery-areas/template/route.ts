import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { areaTemplate } from "@/lib/delivery/areas-import";
import { adminAreaRecords, refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { areaAssignments, areasState } from "@/lib/delivery/zones";

export const dynamic = "force-dynamic";

/** GET — the delivery-area .xlsx template (D50) with the current areas as rows. Merkez only. */
export async function GET() {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  if (scope.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  await Promise.all([refreshDeliveryAreas(), refreshDeliveryFees()]);
  // unreadable areas or fees: an empty template rather than older values
  const records = areasState() === "ready" ? adminAreaRecords(areaAssignments()) : null;
  const body = areaTemplate(records);
  return new NextResponse(new Blob([body as BlobPart]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="funda1959-teslimat-bolgeleri.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
