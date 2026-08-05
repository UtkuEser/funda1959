import { site } from "@/content/site";
import { branches } from "@/content/branches";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: site.name,
    description: site.shortDescription,
    url: site.url,
    foundingDate: site.year,
    priceRange: "₺₺",
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressCountry: "TR",
    },
    sameAs: [site.instagram],
    department: branches.map((branch) => ({
      "@type": "Bakery",
      name: branch.name,
      telephone: branch.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.address,
        addressLocality: site.city,
        addressCountry: "TR",
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.url}`,
    })),
  };
}
