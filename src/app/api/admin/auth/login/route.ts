import { NextResponse } from "next/server";
import { verifyBranchCredentials, verifyCentralCredentials } from "@/lib/admin/credentials";
import { createAdminSession, BRANCH_IDS, type BranchId } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

type Body = {
  mode?: "central";
  branchId?: string;
  username?: string;
  password?: string;
};

// Same message for every failure — never reveal which of username/branch/password was wrong.
const INVALID = { error: "Kullanıcı adı veya şifre hatalı." } as const;

function isBranchId(value: unknown): value is BranchId {
  return typeof value === "string" && (BRANCH_IDS as string[]).includes(value);
}

/**
 * POST /api/admin/auth/login — one endpoint for both the branch login
 * (`/admin-giris`) and the central login (`/merkez-giris`), so the
 * credential-checking logic exists exactly once.
 *
 * Demo-grade auth (env-var credentials + a signed cookie) — see the TODO
 * in `src/lib/admin/session.ts` for what replaces this before production.
 *
 * TODO (production): brute-force protection, rate limiting, account
 * lockout on this endpoint. Not implemented in this round.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json(INVALID, { status: 401 });

  if (body.mode === "central") {
    if (!verifyCentralCredentials(username, password)) {
      return NextResponse.json(INVALID, { status: 401 });
    }
    await createAdminSession({ role: "SUPER_ADMIN" });
    return NextResponse.json({ ok: true, role: "SUPER_ADMIN" });
  }

  if (!isBranchId(body.branchId)) {
    return NextResponse.json({ error: "Geçersiz şube." }, { status: 400 });
  }
  if (!verifyBranchCredentials(body.branchId, username, password)) {
    return NextResponse.json(INVALID, { status: 401 });
  }
  await createAdminSession({ role: "BRANCH_MANAGER", branchId: body.branchId });
  return NextResponse.json({ ok: true, role: "BRANCH_MANAGER", branchId: body.branchId });
}
