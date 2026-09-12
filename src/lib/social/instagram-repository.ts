/**
 * Instagram content repository — same in-memory-on-`globalThis` shape as
 * `campaigns/repository.ts`; swap via `setInstagramContentRepository()` when
 * this moves to Supabase.
 */

import type { InstagramContent, NewInstagramContentInput } from "./instagram-types";
import { INSTAGRAM_CONTENT_SEED } from "./instagram-mock";

export interface InstagramContentRepository {
  list(): InstagramContent[];
  get(id: string): InstagramContent | null;
  /** published === true, sortOrder ASC */
  listPublished(): InstagramContent[];
  create(input: NewInstagramContentInput): InstagramContent;
  update(id: string, patch: Partial<NewInstagramContentInput>): InstagramContent | null;
  remove(id: string): boolean;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ig_${crypto.randomUUID()}`;
  }
  return `ig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const globalStore = globalThis as unknown as { __fundaInstagramContent?: Map<string, InstagramContent> };

class InMemoryInstagramContentRepository implements InstagramContentRepository {
  private readonly rows: Map<string, InstagramContent>;

  constructor() {
    globalStore.__fundaInstagramContent ??= new Map(INSTAGRAM_CONTENT_SEED.map((c) => [c.id, c]));
    this.rows = globalStore.__fundaInstagramContent;
  }

  list(): InstagramContent[] {
    return [...this.rows.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get(id: string): InstagramContent | null {
    return this.rows.get(id) ?? null;
  }

  listPublished(): InstagramContent[] {
    return this.list().filter((c) => c.published);
  }

  create(input: NewInstagramContentInput): InstagramContent {
    const nowISO = new Date().toISOString();
    const content: InstagramContent = { ...input, id: makeId(), createdAt: nowISO, updatedAt: nowISO };
    this.rows.set(content.id, content);
    return content;
  }

  update(id: string, patch: Partial<NewInstagramContentInput>): InstagramContent | null {
    const cur = this.rows.get(id);
    if (!cur) return null;
    const next: InstagramContent = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.rows.set(id, next);
    return next;
  }

  remove(id: string): boolean {
    return this.rows.delete(id);
  }
}

let repo: InstagramContentRepository = new InMemoryInstagramContentRepository();

export function setInstagramContentRepository(next: InstagramContentRepository): void {
  repo = next;
}
export function getInstagramContentRepository(): InstagramContentRepository {
  return repo;
}

export function validateInstagramContentInput(input: NewInstagramContentInput): string[] {
  const errors: string[] = [];
  if (!input.videoUrl || !input.videoUrl.trim()) errors.push("Video URL / path boş olamaz.");
  if (!input.posterImage || !input.posterImage.trim()) errors.push("Poster görsel path boş olamaz.");
  if (!input.instagramUrl || !/^https:\/\/(www\.)?instagram\.com\//.test(input.instagramUrl.trim())) {
    errors.push("Instagram URL geçersiz (https://instagram.com/... ile başlamalı).");
  }
  if (!Number.isFinite(input.sortOrder)) errors.push("Sıra sayısal olmalı.");
  return errors;
}
