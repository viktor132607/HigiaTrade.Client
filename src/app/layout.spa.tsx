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
    title: "HygiaTrade | SANO дистрибутор за Русе и региона",
    description:
      "SANO, перилни и почистващи препарати за Русе, Силистра, Разград, Свищов, Бяла и Търговище.",
    images: [
      {
        url: "/higiqlogo.png",
        alt: "HygiaTrade - Хигия Трейд ООД",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HygiaTrade | SANO дистрибутор за Русе и региона",
    description:
      "Хигия Трейд ООД - SANO дистрибутор и доставчик на перилни и почистващи препарати за Русе и региона.",
    images: ["/higiqlogo.png"],
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
      telephone: "+359888822861",
      email: "higiatrade@abv.bg",
      description:
        "Дистрибутор на SANO и доставчик на перилни, почистващи и хигиенни продукти за Русе, Силистра, Разград, Свищов, Бяла и Търговище.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "ул. Акад. Михаил Арнаудов №3",
        addressLocality: "Русе",
        addressCountry: "BG",
      },
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
        telephone: "+359888822861",
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
