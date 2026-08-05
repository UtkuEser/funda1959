import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { categories } from "@/content/menu";

const staticRoutes = [
  "",
  "/hikayemiz",
  "/lezzetler",
  "/imza-lezzetler",
  "/subeler",
  "/paket-hediye",
  "/kurumsal",
  "/iletisim",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${site.url}${route}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...categories.map((category) => ({
      url: `${site.url}/lezzetler/${category.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
