import type { Metadata } from "next";
import { search } from "@/lib/search";
import { SearchResultsView } from "@/components/search/SearchResultsView";

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  // `search()` is pure + deterministic, so running it on the server avoids
  // any hydration mismatch. The client view only filters/sorts the result.
  const results = search(q);
  return <SearchResultsView results={results} query={q} />;
}
