import { NextResponse } from "next/server";
import { buildOrderPayload } from "@/lib/order-server";
import { createOrder } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "Siparişiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const built = buildOrderPayload(body);
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error }, { status: 400 });
  }

  try {
    const order = await createOrder(built.payload);
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (err) {
    console.error("[api/orders] create failed:", err);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 502 });
  }
}
