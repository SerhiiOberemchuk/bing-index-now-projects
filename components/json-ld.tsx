export function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OBRIYM",
    url: "https://obriym.online",
    logo: "https://obriym.online/logo.png",
    description:
      "Agenzia web full-cycle specializzata in sviluppo siti web, app, e-commerce, UI/UX design e SEO.",
    foundingDate: "2020",
    sameAs: [
      "https://www.linkedin.com/company/obriym",
      "https://t.me/obriym",
      "https://www.upwork.com/agencies/obriym",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+39-XXX-XXXXXXX",
      contactType: "customer service",
      email: "info@obriym.online",
      availableLanguage: ["Italian"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
    },
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "OBRIYM - Agenzia Web",
    image: "https://obriym.online/og-image.jpg",
    url: "https://obriym.online",
    telephone: "+39-XXX-XXXXXXX",
    email: "info@obriym.online",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.9028,
      longitude: 12.4964,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    sameAs: [
      "https://www.linkedin.com/company/obriym",
      "https://t.me/obriym",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "25",
    },
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Servizi di sviluppo web",
    description: "Servizi offerti da OBRIYM agenzia web",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          name: "Sviluppo Web",
          description:
            "Creiamo applicazioni web veloci, affidabili e scalabili utilizzando tecnologie moderne.",
          provider: { "@type": "Organization", name: "OBRIYM" },
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Service",
          name: "Design UI/UX",
          description:
            "Progettiamo interfacce intuitive che garantiscono la migliore esperienza utente.",
          provider: { "@type": "Organization", name: "OBRIYM" },
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Service",
          name: "Ottimizzazione SEO",
          description:
            "Ottimizziamo i siti per i motori di ricerca affinché i clienti trovino la tua attività.",
          provider: { "@type": "Organization", name: "OBRIYM" },
        },
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "Service",
          name: "E-commerce",
          description:
            "Sviluppiamo negozi online completi con pagamenti sicuri e gestione ordini.",
          provider: { "@type": "Organization", name: "OBRIYM" },
        },
      },
      {
        "@type": "ListItem",
        position: 5,
        item: {
          "@type": "Service",
          name: "Branding",
          description:
            "Sviluppiamo un'identità visiva unica che distingue il tuo brand.",
          provider: { "@type": "Organization", name: "OBRIYM" },
        },
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OBRIYM",
    url: "https://obriym.online",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://obriym.online/?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(servicesSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}
