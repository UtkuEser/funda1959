"use client";

import { useState } from "react";
import Image from "next/image";
import type { InstagramContent, NewInstagramContentInput } from "@/lib/social";
import { Panel, Table, TableWrap, Th, Td, Row, EmptyRow, Badge } from "@/components/admin/ui";

/** `posterPreview` is resolved server-side (fs check) before reaching this client component. */
type ListItem = InstagramContent & { posterPreview: string | null };

type FormState = {
  title: string;
  videoUrl: string;
  posterImage: string;
  instagramUrl: string;
  published: boolean;
  sortOrder: number;
};

function blankForm(nextSortOrder: number): FormState {
  return { title: "", videoUrl: "", posterImage: "", instagramUrl: "", published: true, sortOrder: nextSortOrder };
}

function formFromItem(c: InstagramContent): FormState {
  return {
    title: c.title ?? "",
    videoUrl: c.videoUrl,
    posterImage: c.posterImage,
    instagramUrl: c.instagramUrl,
    published: c.published,
    sortOrder: c.sortOrder,
  };
}

function validateForm(f: FormState): string | null {
  if (!f.videoUrl.trim()) return "Video URL / path boş olamaz.";
  if (!f.posterImage.trim()) return "Poster görsel path boş olamaz.";
  if (!/^https:\/\/(www\.)?instagram\.com\//.test(f.instagramUrl.trim())) {
    return "Instagram URL geçersiz (https://instagram.com/... ile başlamalı).";
  }
  if (!Number.isFinite(f.sortOrder)) return "Sıra sayısal olmalı.";
  return null;
}

export function AdminInstagramContent({ initialItems }: { initialItems: ListItem[] }) {
  const [items, setItems] = useState<ListItem[]>(initialItems);

  /** API responses carry plain InstagramContent; keep each row's previously resolved thumbnail by id. */
  const mergePreview = (next: InstagramContent[]): ListItem[] =>
    next.map((i) => ({ ...i, posterPreview: items.find((p) => p.id === i.id)?.posterPreview ?? null }));
  const [editing, setEditing] = useState<InstagramContent | "new" | null>(null);
  const [form, setForm] = useState<FormState>(blankForm(1));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const openNew = () => {
    const nextSortOrder = items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1;
    setForm(blankForm(nextSortOrder));
    setFormError(null);
    setEditing("new");
  };
  const openEdit = (c: InstagramContent) => {
    setForm(formFromItem(c));
    setFormError(null);
    setEditing(c);
  };
  const close = () => {
    setEditing(null);
    setFormError(null);
  };

  const submit = async () => {
    const err = validateForm(form);
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: { id?: string } & NewInstagramContentInput = {
      ...(editing !== "new" && editing ? { id: editing.id } : {}),
      title: form.title.trim() || undefined,
      videoUrl: form.videoUrl.trim(),
      posterImage: form.posterImage.trim(),
      instagramUrl: form.instagramUrl.trim(),
      published: form.published,
      sortOrder: Number(form.sortOrder),
    };
    try {
      const res = await fetch("/api/admin/instagram", {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; items?: InstagramContent[]; error?: string };
      if (res.ok && data.ok && data.items) {
        setItems(mergePreview(data.items));
        setFeedback({ tone: "ok", text: editing === "new" ? "İçerik oluşturuldu." : "İçerik güncellendi." });
        close();
      } else {
        setFormError(data.error ?? "Kaydedilemedi.");
      }
    } catch {
      setFormError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/instagram?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; items?: InstagramContent[]; error?: string };
      if (res.ok && data.ok && data.items) {
        setItems(mergePreview(data.items));
        setFeedback({ tone: "ok", text: "İçerik silindi." });
      } else {
        setFeedback({ tone: "err", text: data.error ?? "Silinemedi." });
      }
    } catch {
      setFeedback({ tone: "err", text: "Silinemedi." });
    }
  };

  const inputClass =
    "h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none";
  const labelClass = "mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-neutral-500";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        {feedback ? (
          <span role="status" className={`text-[12.5px] font-medium ${feedback.tone === "err" ? "text-neutral-900 underline" : "text-neutral-500"}`}>
            {feedback.text}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={openNew}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          + Yeni İçerik
        </button>
      </div>

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Kapak</Th>
                <Th>Başlık</Th>
                <Th>Instagram URL</Th>
                <Th>Durum</Th>
                <Th align="right">Sıra</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <EmptyRow cols={6}>Henüz içerik yok.</EmptyRow>}
              {items.map((item) => (
                  <Row key={item.id}>
                    <Td>
                      <div className="h-12 w-9 overflow-hidden rounded bg-gradient-to-br from-[#E8C5A8] to-[#D4A878]">
                        {item.posterPreview && (
                          <Image src={item.posterPreview} alt={item.title ?? "Instagram içeriği"} width={36} height={48} className="h-full w-full object-cover" />
                        )}
                      </div>
                    </Td>
                    <Td className="font-medium">{item.title ?? "—"}</Td>
                    <Td className="max-w-[220px] truncate text-[12.5px] text-neutral-500">{item.instagramUrl}</Td>
                    <Td>
                      <Badge strong={item.published}>{item.published ? "Yayında" : "Taslak"}</Badge>
                    </Td>
                    <Td align="right" className="tabular-nums">{item.sortOrder}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => openEdit(item)} className="text-[12.5px] font-semibold text-neutral-700 underline hover:text-neutral-900">
                          Düzenle
                        </button>
                        <button type="button" onClick={() => remove(item.id)} className="text-[12.5px] font-semibold text-neutral-400 underline hover:text-neutral-900">
                          Sil
                        </button>
                      </div>
                    </Td>
                  </Row>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                {editing === "new" ? "Yeni İçerik" : "İçeriği Düzenle"}
              </h2>
              <button type="button" onClick={close} aria-label="Kapat" className="text-neutral-400 hover:text-neutral-900">
                ✕
              </button>
            </div>

            {formError && (
              <p role="alert" className="mb-3 rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-900">
                {formError}
              </p>
            )}

            <div className="space-y-3.5">
              <div>
                <label className={labelClass}>Başlık (opsiyonel)</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Video URL / Path</label>
                <input
                  className={inputClass}
                  placeholder="/social/reels/reel-01.mp4"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Poster Görsel Path</label>
                <input
                  className={inputClass}
                  placeholder="/social/reels/reel-01-cover.webp"
                  value={form.posterImage}
                  onChange={(e) => setForm({ ...form, posterImage: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Instagram URL</label>
                <input
                  className={inputClass}
                  placeholder="https://www.instagram.com/reel/..."
                  value={form.instagramUrl}
                  onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Sıra</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Math.floor(Number(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Durum</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, published: !form.published })}
                    aria-pressed={form.published}
                    className={`h-9 w-full rounded border px-2.5 text-[13px] font-medium ${
                      form.published ? "border-neutral-900 text-neutral-900" : "border-neutral-300 text-neutral-400"
                    }`}
                  >
                    {form.published ? "Yayında" : "Taslak"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={close} className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-50">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
