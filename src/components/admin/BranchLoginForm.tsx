"use client";

import { useState } from "react";
import { AdminAuthCard, authInputClass, authLabelClass } from "./AdminAuthCard";

type Branch = { id: "gop" | "panora" | "incek"; label: string };

// SUPER_ADMIN is intentionally never in this list — central login lives at
// the separate, unlinked /merkez-giris.
const BRANCHES: Branch[] = [
  { id: "gop", label: "GOP" },
  { id: "panora", label: "Panora" },
  { id: "incek", label: "İncek" },
];

export function BranchLoginForm() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeBranch = () => {
    setBranch(null);
    setError(null);
    setPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch.id, username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        // Full navigation, not router.push — guarantees no stale
        // client-router cache survives the identity change.
        window.location.href = "/admin";
        return;
      }
      setError(data.error ?? "Kullanıcı adı veya şifre hatalı.");
    } catch {
      setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!branch) {
    return (
      <AdminAuthCard
        title="Yönetim Paneli"
        subtitle="Devam etmek için yönettiğiniz şubeyi seçin."
        onTitleClick={() => (window.location.href = "/merkez-giris")}
      >
        <div className="space-y-2.5">
          {BRANCHES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranch(b)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left text-[14.5px] font-medium text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50"
            >
              {b.label}
              <span className="text-neutral-400">→</span>
            </button>
          ))}
        </div>
      </AdminAuthCard>
    );
  }

  return (
    <AdminAuthCard
      title={`Funda 1959 ${branch.label}`}
      onTitleClick={() => (window.location.href = "/merkez-giris")}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-800"
          >
            {error}
          </p>
        )}
        <div>
          <label htmlFor="branch-username" className={authLabelClass}>
            Kullanıcı Adı
          </label>
          <input
            id="branch-username"
            type="text"
            autoComplete="username"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="branch-password" className={authLabelClass}>
            Şifre
          </label>
          <div className="relative">
            <input
              id="branch-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${authInputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] font-semibold text-neutral-400 hover:text-neutral-700"
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 w-full rounded-md bg-neutral-900 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
        >
          {submitting ? "Giriş Yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
      <button
        type="button"
        onClick={changeBranch}
        className="mt-5 text-[13px] font-medium text-neutral-500 hover:text-neutral-900"
      >
        ← Şube değiştir
      </button>
    </AdminAuthCard>
  );
}
