import { NextResponse } from "next/server";
import { productGate } from "@/lib/catalog/http";
import { importTemplate } from "@/lib/catalog/import";

export const dynamic = "force-dynamic";

/** GET — the .xlsx template for "Excel'den Ürün Yükle" (D48). Merkez only, test data only. */
export async function GET(request: Request) {
  const gate = await productGate(request, { write: false });
  if (gate instanceof NextResponse) return gate;
  const body = importTemplate();
  return new NextResponse(new Blob([body as BlobPart]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="funda1959-urun-sablonu.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
