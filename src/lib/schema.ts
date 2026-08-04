import { branches } from "./data";

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: "Funda 1959",
    description:
      "1959'dan beri Ankara'da hizmet veren köklü cafe ve pastane. Yaş pastalar, özel gün pastaları, çikolatalar ve geleneksel Türk tatlıları.",
    url: "https://funda1959.com",
    logo: "https://funda1959.com/logo.png",
    foundingDate: "1959",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ankara",
      addressCountry: "TR",
    },
    location: branches.map(branch => ({
      "@type": "Bakery",
      name: branch.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.address,
        addressLocality: "Ankara",
        addressCountry: "TR",
      },
      telephone: branch.phone,
      openingHours: "Mo-Su 08:00-22:00",
    })),
    telephone: "+90 312 447 00 00",
    servesCuisine: ["Türk Pastacılığı", "Fransız Pastacılığı", "Çikolata"],
    priceRange: "₺₺",
    hasMenu: "https://funda1959.com/lezzetlerimiz",
    sameAs: ["https://www.instagram.com/funda.1959"],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
