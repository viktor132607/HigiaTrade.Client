import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://higiatrade.com").replace(/\/$/, "");

const PRIVATE_PREFIXES = [
  "/admin",
  "/cart",
  "/checkout",
  "/profile",
  "/wishlist",
  "/orders",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const REGION_NAMES: Record<string, { bg: string; en: string }> = {
  ruse: { bg: "Русе", en: "Ruse" },
  silistra: { bg: "Силистра", en: "Silistra" },
  razgrad: { bg: "Разград", en: "Razgrad" },
  svishtov: { bg: "Свищов", en: "Svishtov" },
  byala: { bg: "Бяла", en: "Byala" },
  targovishte: { bg: "Търговище", en: "Targovishte" },
};

const normalizePath = (path: string) =>
  path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;

const setMeta = (name: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setPropertyMeta = (property: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const SeoManager = () => {
  const location = useLocation();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  useEffect(() => {
    const path = location.pathname || "/";
    const normalizedPath = normalizePath(path);
    const currentCanonical = `${SITE_URL}${normalizedPath}`;

    // Build-time SEO pages already contain exact Product/Offer/Brand schemas and
    // route-specific metadata in the initial HTML. Keep those tags intact on the
    // first direct visit so hydration cannot replace them with generic SPA data.
    // If the visitor navigates elsewhere without a reload, remove the stale
    // generated JSON-LD and let the SPA manager own the new route metadata.
    const generatedScripts = Array.from(
      document.head.querySelectorAll<HTMLScriptElement>('script[data-generated-seo="true"]')
    );
    const canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const generatedCanonicalMatches =
      generatedScripts.length > 0 && canonicalElement?.href === currentCanonical;

    document.documentElement.lang = isBg ? "bg" : "en";

    if (generatedCanonicalMatches) {
      return;
    }

    if (generatedScripts.length > 0) {
      generatedScripts.forEach((script) => script.remove());
    }

    const isPrivate = PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

    let title = isBg
      ? "HygiaTrade | SANO дистрибутор и почистващи препарати за Русе и региона"
      : "HygiaTrade | SANO distributor and cleaning supplies for Ruse region";
    let description = isBg
      ? "Хигия Трейд ООД е дистрибутор на SANO за Русе, Силистра, Разград, Свищов, Бяла и Търговище. Перилни и почистващи препарати, консумативи и доставки за дома и бизнеса."
      : "Hygia Trade Ltd. is the SANO distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte. Laundry and cleaning products, supplies and business deliveries.";

    const regionMatch = path.match(/^\/sano\/([^/]+)\/?$/);
    const region = regionMatch ? REGION_NAMES[regionMatch[1].toLowerCase()] : undefined;

    if (region) {
      const regionName = isBg ? region.bg : region.en;
      title = isBg
        ? `SANO дистрибутор за ${regionName} | HygiaTrade`
        : `SANO distributor for ${regionName} | HygiaTrade`;
      description = isBg
        ? `Хигия Трейд ООД доставя SANO перилни и почистващи препарати за ${regionName} за дома, магазини, офиси и бизнес клиенти.`
        : `Hygia Trade Ltd. supplies SANO laundry and cleaning products in ${regionName} for households, shops, offices and business customers.`;
    } else if (path === "/sano" || path === "/sano-distributor") {
      title = isBg
        ? "SANO дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище | HygiaTrade"
        : "SANO distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte | HygiaTrade";
      description = isBg
        ? "Хигия Трейд ООД е публикуван дистрибутор на SANO за Русе, Силистра, Разград, Свищов, Бяла и Търговище. Заявки за SANO перилни и почистващи препарати за дома и бизнеса."
        : "Hygia Trade Ltd. is a listed SANO distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte. SANO laundry and cleaning product enquiries for home and business.";
    } else if (path === "/products" || path === "/store") {
      title = isBg ? "Перилни и почистващи препарати | HygiaTrade" : "Laundry and cleaning products | HygiaTrade";
      description = isBg
        ? "Каталог с перилни и почистващи препарати, хартиени изделия, консумативи и професионални решения за дома, офиса и бизнеса."
        : "Catalogue of laundry and cleaning products, paper goods, supplies and professional hygiene solutions for home, office and business.";
    } else if (path === "/brands") {
      title = isBg ? "Марки почистващи препарати и SANO | HygiaTrade" : "Cleaning brands and SANO | HygiaTrade";
      description = isBg
        ? "Разгледайте марките в HygiaTrade, включително SANO, и наличните перилни, почистващи и професионални хигиенни продукти."
        : "Browse HygiaTrade brands including SANO and available laundry, cleaning and professional hygiene products.";
    } else if (path.startsWith("/brands/")) {
      const brandSlug = decodeURIComponent(path.split("/")[2] || "").replace(/-/g, " ");
      title = isBg ? `${brandSlug} - продукти | HygiaTrade` : `${brandSlug} products | HygiaTrade`;
      description = isBg
        ? `Продукти от марка ${brandSlug} в каталога на HygiaTrade за дома, офиса и бизнеса.`
        : `${brandSlug} products in the HygiaTrade catalogue for home, office and business use.`;
    } else if (path === "/contact") {
      title = isBg ? "Контакти и дистрибуция за Русе и региона | HygiaTrade" : "Contacts and distribution for Ruse region | HygiaTrade";
    } else if (path === "/about") {
      title = isBg ? "За Хигия Трейд ООД | HygiaTrade" : "About Hygia Trade Ltd. | HygiaTrade";
    } else if (path.startsWith("/products/")) {
      title = isBg ? "Продукт | HygiaTrade" : "Product | HygiaTrade";
      description = isBg
        ? "Продукт от каталога на HygiaTrade за почистващи препарати, перилни препарати и хигиенни консумативи."
        : "Product from the HygiaTrade catalogue of cleaning products, laundry detergents and hygiene supplies.";
    }

    document.title = title;
    setMeta("description", description);
    setMeta("robots", isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description);
    setPropertyMeta("og:type", "website");
    setPropertyMeta("og:url", currentCanonical);
    setPropertyMeta("og:site_name", "HygiaTrade");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setCanonical(currentCanonical);

    let script = document.head.querySelector<HTMLScriptElement>('#route-seo-jsonld');
    if (!script) {
      script = document.createElement("script");
      script.id = "route-seo-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const jsonLd = region
      ? {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          url: currentCanonical,
          description,
          about: { "@type": "Brand", name: "SANO" },
          mainEntity: {
            "@type": "Organization",
            name: "Хигия Трейд ООД",
            alternateName: "HygiaTrade",
            telephone: "+359888822861",
            email: "higiatrade@abv.bg",
            areaServed: { "@type": "City", name: region.bg },
            brand: { "@type": "Brand", name: "SANO" },
            subjectOf: {
              "@type": "WebPage",
              url: "https://sanobg.com/buy/",
              name: "SANO България - дистрибутори",
            },
          },
        }
      : path === "/sano" || path === "/sano-distributor"
        ? {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            url: `${SITE_URL}/sano/`,
            description,
            about: {
              "@type": "Brand",
              name: "SANO",
            },
            mainEntity: {
              "@type": "Organization",
              name: "Хигия Трейд ООД",
              alternateName: "HygiaTrade",
              telephone: "+359888822861",
              email: "higiatrade@abv.bg",
              address: {
                "@type": "PostalAddress",
                streetAddress: "ул. Акад. Михаил Арнаудов №3",
                addressLocality: "Русе",
                addressCountry: "BG",
              },
              areaServed: SERVICE_AREAS,
              brand: { "@type": "Brand", name: "SANO" },
              subjectOf: {
                "@type": "WebPage",
                url: "https://sanobg.com/buy/",
                name: "SANO България - дистрибутори",
              },
            },
          }
        : {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            url: currentCanonical,
            description,
          };

    script.textContent = JSON.stringify(jsonLd);
  }, [isBg, location.pathname]);

  return null;
};

const SERVICE_AREAS = [
  { "@type": "City", name: "Русе" },
  { "@type": "City", name: "Силистра" },
  { "@type": "City", name: "Разград" },
  { "@type": "City", name: "Свищов" },
  { "@type": "City", name: "Бяла" },
  { "@type": "City", name: "Търговище" },
];

export default SeoManager;
