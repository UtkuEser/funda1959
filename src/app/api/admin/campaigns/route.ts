import "@/lib/campaigns/server-init";
import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { listBranches } from "@/lib/branch";
import {
  getCampaignRepository,
  validateCampaignInput,
  type NewCampaignInput,
} from "@/lib/campaigns";

export const dynamic = "force-dynamic";

/** Campaign create/edit/delete is SUPER_ADMIN-only; managers are read-only. Derived from the session, never a client-supplied field. */
async function authorized(): Promise<boolean> {
  const scope = await resolveAdminScope();
  return scope?.user.role === "SUPER_ADMIN";
}

type Body = { id?: string } & Partial<NewCampaignInput>;

function toInput(body: Body): NewCampaignInput {
  return {
    title: typeof body.title === "string" ? body.title : "",
    description: typeof body.description === "string" ? body.description : "",
    image: typeof body.image === "string" ? body.image : "",
    startAt: typeof body.startAt === "string" ? body.startAt : "",
    endAt: typeof body.endAt === "string" ? body.endAt : "",
    ctaLabel: typeof body.ctaLabel === "string" ? body.ctaLabel : "",
    ctaHref: typeof body.ctaHref === "string" ? body.ctaHref : "",
    active: Boolean(body.active),
    branchIds: body.branchIds === "all" ? "all" : Array.isArray(body.branchIds) ? body.branchIds : "all",
    priority: typeof body.priority === "number" ? body.priority : Number(body.priority),
  };
}

/** Never a silent fake success — a Supabase failure surfaces as a real error to the admin form. */
function persistenceFailed(action: string, err: unknown) {
  console.error(`[campaigns] ${action} failed`, err);
  return NextResponse.json(
    { error: "Kampanya kaydedilemedi — veritabanına ulaşılamadı. Lütfen tekrar deneyin." },
    { status: 502 },
  );
}

/** POST — create a campaign. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (!(await authorized())) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const input = toInput(body);
  const validBranchIds = listBranches().map((b) => b.id);
  const errors = validateCampaignInput(input, validBranchIds);
  if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

  try {
    await getCampaignRepository().create(input);
    const campaigns = await getCampaignRepository().list();
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    return persistenceFailed("create", err);
  }
}

/** PATCH — update a campaign (id in body). */
export async function PATCH(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (!(await authorized())) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }
  if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const input = toInput(body);
  const validBranchIds = listBranches().map((b) => b.id);
  const errors = validateCampaignInput(input, validBranchIds);
  if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

  try {
    const updated = await getCampaignRepository().update(body.id, input);
    if (!updated) return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 });
    const campaigns = await getCampaignRepository().list();
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    return persistenceFailed("update", err);
  }
}

/** DELETE ?id= — remove a campaign. */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!(await authorized())) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  try {
    await getCampaignRepository().remove(id);
    const campaigns = await getCampaignRepository().list();
    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    return persistenceFailed("delete", err);
  }
}
