"use client";

import { useState } from "react";
import { AdminAuthCard, authInputClass, authLabelClass } from "./AdminAuthCard";

/**
 * Central (SUPER_ADMIN) login — deliberately its own component, not a
 * variant of `BranchLoginForm`. This form never mentions or links to
 * `/admin-giris`, and no branch selection ever appears here.
 */
export function CentralLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "central", username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
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

  return (
    <AdminAuthCard title="Merkez Yönetim">
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
          <label htmlFor="central-username" className={authLabelClass}>
            Kullanıcı Adı
          </label>
          <input
            id="central-username"
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
          <label htmlFor="central-password" className={authLabelClass}>
            Şifre
          </label>
          <div className="relative">
            <input
              id="central-password"
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
    </AdminAuthCard>
  );
}
