/**
 * Is product management ("Ürün Ekle", D45) open on this deployment? (D46)
 *
 * A code switch, not an environment variable, like the contact form (D43):
 * open on a developer machine and Vercel Preview (funda1959-test), closed on
 * Production — the panel isn't shown there and every product API answers
 * 503 before reading the request, so nothing is written to production data.
 * Opening it on Production is a separate change and approval.
 */

import { expectedDataEnvironment } from "../supabase-server";

export function isProductManagementOpen(): boolean {
  return expectedDataEnvironment() === "test";
}
