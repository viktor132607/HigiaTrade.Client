import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../index.css";
import "../App.css";

const SITE_URL = "https://higiatrade.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HygiaTrade | SANO дистрибутор и почистващи препарати за Русе и региона",
    template: "%s | HygiaTrade",
  },
  description:
    "Хигия Трейд ООД е дистрибутор на SANO за Русе, Силистра, Разград, Свищов, Бяла и Търговище. Перилни и почистващи препарати, консумативи и доставки за дома и бизнеса.",
  // Transparent favicon is for tabs. Sharing cards use a separate, correctly
  // proportioned 1200×630 asset with the real company logo fully visible.
  icons: {
    icon: [{ url: "/cleaning-icon-transparent-original.png", type: "image/png" }],
    shortcut: "/cleaning-icon-transparent-original.png",
    apple: [{ url: "/cleaning-icon-transparent-original.png", type: "image/png" }],
  },
  keywords: [
    "SANO",
    "SANO дистрибутор Русе",
    "SANO Силистра",
    "SANO Разград",
    "SANO Свищов",
    "SANO Бяла",
    "SANO Търговище",
    "перилни препарати",
    "почистващи препарати",
    "професионални почистващи препарати",
    "Хигия Трейд",
    "HygiaTrade",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: SITE_URL,
    siteName: "HygiaTrade",
    title: "HygiaTrade | Хигия Трейд",
    description:
      "SANO дистрибутор за Русе и региона. Перилни и почистващи препарати за дома и бизнеса.",
    images: [
      {
        url: "/social-card-2026.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Хигия Трейд ООД — SANO дистрибутор за Русе и региона",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HygiaTrade | Хигия Трейд",
    description:
      "SANO дистрибутор за Русе и региона. Перилни и почистващи препарати за дома и бизнеса.",
    images: ["/social-card-2026.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "cleaning products and laundry detergents",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "Store"],
      "@id": `${SITE_URL}/#organization`,
      name: "Хигия Трейд ООД",
      alternateName: "HygiaTrade",
      url: SITE_URL,
      logo: `${SITE_URL}/higiqlogo.png`,
      telephone: ["+359888822861", "+359883778177"],
      email: "higiatrade@abv.bg",
      description:
        "Дистрибутор на SANO и доставчик на перилни, почистващи и хигиенни продукти за Русе, Силистра, Разград, Свищов, Бяла и Търговище.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Потсдам №1",
        addressLocality: "Русе",
        addressCountry: "BG",
      },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      }],
      areaServed: ["Русе", "Силистра", "Разград", "Свищов", "Бяла", "Търговище"].map((name) => ({
        "@type": "City",
        name,
      })),
      brand: {
        "@type": "Brand",
        name: "SANO",
      },
      knowsAbout: [
        "SANO",
        "перилни препарати",
        "почистващи препарати",
        "професионална хигиена",
        "хигиенни консумативи",
      ],
      subjectOf: {
        "@type": "WebPage",
        name: "SANO България - Откъде да купя / Дистрибутори",
        url: "https://sanobg.com/buy/",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: ["+359888822861", "+359883778177"],
        email: "higiatrade@abv.bg",
        contactType: "sales",
        areaServed: "BG",
        availableLanguage: ["bg", "en"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "HygiaTrade",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      inLanguage: ["bg", "en"],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
