import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import {
  getInstagramContentRepository,
  validateInstagramContentInput,
  type NewInstagramContentInput,
} from "@/lib/social";

export const dynamic = "force-dynamic";

/** Instagram content management is SUPER_ADMIN-only. Derived from the session, never a client-supplied field. */
async function authorized(): Promise<boolean> {
  const scope = await resolveAdminScope();
  return scope?.user.role === "SUPER_ADMIN";
}

type Body = { id?: string } & Partial<NewInstagramContentInput>;

function toInput(body: Body): NewInstagramContentInput {
  return {
    title: typeof body.title === "string" && body.title.trim() ? body.title : undefined,
    videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : "",
    posterImage: typeof body.posterImage === "string" ? body.posterImage : "",
    instagramUrl: typeof body.instagramUrl === "string" ? body.instagramUrl : "",
    published: Boolean(body.published),
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder),
  };
}

/** POST — create an Instagram content item. */
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
  const errors = validateInstagramContentInput(input);
  if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

  getInstagramContentRepository().create(input);
  return NextResponse.json({ ok: true, items: getInstagramContentRepository().list() });
}

/** PATCH — update an item (id in body). */
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
  const errors = validateInstagramContentInput(input);
  if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

  const updated = getInstagramContentRepository().update(body.id, input);
  if (!updated) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, items: getInstagramContentRepository().list() });
}

/** DELETE ?id= — remove an item. */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!(await authorized())) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  getInstagramContentRepository().remove(id);
  return NextResponse.json({ ok: true, items: getInstagramContentRepository().list() });
}
