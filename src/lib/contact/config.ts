/**
 * Is the /iletisim form open in this deployment? (D43)
 *
 * A code switch, not an environment variable: open on a developer machine
 * and Vercel Preview (funda1959-test), closed on Production until the
 * privacy notice, retention and deletion policy are decided and a separate
 * change opens it. Closed means the form isn't shown and POST /api/contact
 * refuses before reading the request.
 */

import { expectedDataEnvironment } from "../supabase-server";

export function isContactFormOpen(): boolean {
  return expectedDataEnvironment() === "test";
}
