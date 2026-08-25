import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://higiatrade.com").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://higiatrade-server.onrender.com/api").replace(/\/$/, "");
const OUT_DIR = resolve(process.cwd(), "out");
const GOOGLE_SITE_VERIFICATION = (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "").trim();
const BING_SITE_VERIFICATION = (process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "").trim();
const INDEXNOW_ENDPOINT = (process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow").trim();
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || createHash("sha256").update(`${SITE_URL}|HygiaTrade|IndexNow`).digest("hex")).trim();
const MIN_REGIONAL_CATEGORY_PRODUCTS = Math.max(3, Number(process.env.SEO_MIN_REGIONAL_CATEGORY_PRODUCTS || 4));
const MAX_REGIONAL_CATEGORIES = Math.max(1, Math.min(12, Number(process.env.SEO_MAX_REGIONAL_CATEGORIES || 6)));
const TODAY = new Date().toISOString().slice(0, 10);

const REGIONS = [
  { slug: "ruse", bg: "Русе", en: "Ruse" },
  { slug: "silistra", bg: "Силистра", en: "Silistra" },
  { slug: "razgrad", bg: "Разград", en: "Razgrad" },
  { slug: "svishtov", bg: "Свищов", en: "Svishtov" },
  { slug: "byala", bg: "Бяла", en: "Byala" },
  { slug: "targovishte", bg: "Търговище", en: "Targovishte" },
];

const CYRILLIC = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const escapeXml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const stripHtml = (value = "") => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const truncate = (value, max = 180) => {
  const clean = stripHtml(value);
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
};

function slugify(value, maxLength = 88) {
  const slug = String(value || "")
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "item";
}

function entitySlug(name, id) {
  const token = String(id || "").replace(/-/g, "").slice(0, 8).toLowerCase();
  return `${slugify(name)}-${token || "item"}`;
}

const productPath = (product) => `/products/${entitySlug(product.title, product.id)}/`;
const categoryPath = (category) => `/categories/${entitySlug(category.name, category.id)}/`;
const brandPath = (brandName) => `/brands/${slugify(brandName, 100)}/`;
const regionalCategoryPath = (category, region) => `/${slugify(category.name, 90)}/${region.slug}/`;
const canonical = (path) => `${SITE_URL}${path === "/" ? "/" : `/${String(path).replace(/^\/+|\/+$/g, "")}/`}`;

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function fetchAllProducts() {
  const result = [];
  let page = 1;
  let totalCount = Number.POSITIVE_INFINITY;
  while (result.length < totalCount && page <= 100) {
    const url = new URL(`${API_URL}/Products`);
    url.searchParams.set("PageNumber", String(page));
    url.searchParams.set("PageSize", "100");
    url.searchParams.set("SortBy", "title");
    url.searchParams.set("SortDescending", "false");
    const payload = await fetchJson(url.toString());
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    totalCount = Number.isFinite(Number(payload?.totalCount)) ? Number(payload.totalCount) : result.length + items.length;
    result.push(...items);
    if (items.length < 100) break;
    page += 1;
  }
  return result.filter((item) => item?.id && item?.title && item.isActive !== false);
}

async function readRoute(path) {
  const relative = path === "/" ? "" : String(path).replace(/^\/+|\/+$/g, "");
  return readFile(join(OUT_DIR, relative, "index.html"), "utf8");
}

async function writeRoute(path, html) {
  const relative = path === "/" ? "" : String(path).replace(/^\/+|\/+$/g, "");
  const dir = join(OUT_DIR, relative);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), html, "utf8");
}

function cleanHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, "")
    .replace(/<meta[^>]+property=["']og:(?:title|description|type|url|image)["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']twitter:(?:card|title|description|image)["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");
}

function verificationMeta() {
  return [
    GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(GOOGLE_SITE_VERIFICATION)}" data-seo-enhancer="verification" />` : "",
    BING_SITE_VERIFICATION ? `<meta name="msvalidate.01" content="${escapeHtml(BING_SITE_VERIFICATION)}" data-seo-enhancer="verification" />` : "",
  ].filter(Boolean).join("\n");
}

function baseHead({ title, description, path, jsonLd = [] }) {
  const url = canonical(path);
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  return `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(truncate(description, 165))}" />
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:site_name" content="HygiaTrade" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(truncate(description, 165))}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:image" content="${SITE_URL}/higiqlogo.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(truncate(description, 165))}" />
${verificationMeta()}
${schemas.filter(Boolean).map((schema) => `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="schema">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`).join("\n")}`;
}

function addHead(html, block, marker) {
  if (marker && html.includes(marker)) return html;
  return html.replace("</head>", `${block}\n</head>`);
}

function addBody(html, block, marker) {
  if (marker && html.includes(marker)) return html;
  return html.replace("</body>", `${block}\n</body>`);
}

function organizationEntity() {
  return {
    "@type": ["Organization", "Store"],
    "@id": `${SITE_URL}/#organization`,
    name: "Хигия Трейд ООД",
    alternateName: "HygiaTrade",
    url: `${SITE_URL}/`,
    telephone: "+359888822861",
    email: "higiatrade@abv.bg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Акад. Михаил Арнаудов №3",
      addressLocality: "Русе",
      addressCountry: "BG",
    },
    areaServed: REGIONS.map((region) => ({ "@type": "City", name: region.bg })),
    brand: { "@id": `${SITE_URL}/brands/sano/#brand` },
    subjectOf: {
      "@type": "WebPage",
      url: "https://sanobg.com/buy/",
      name: "SANO България - дистрибутори",
    },
  };
}

function sanoEntityGraph(pagePath) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationEntity(),
      {
        "@type": "Brand",
        "@id": `${SITE_URL}/brands/sano/#brand`,
        name: "SANO",
        url: `${SITE_URL}/brands/sano/`,
        sameAs: ["https://sanobg.com/", "https://sanobg.com/buy/"],
      },
      {
        "@type": "WebPage",
        "@id": `${canonical(pagePath)}#webpage`,
        url: canonical(pagePath),
        about: { "@id": `${SITE_URL}/brands/sano/#brand` },
        provider: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function faqSection(items) {
  return `<section data-seo-enhancer="faq" style="border-top:1px solid #e2e8f0;background:#fff;color:#334155;font-family:Arial,sans-serif">
  <div style="max-width:1280px;margin:0 auto;padding:30px 20px">
    <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#148f7c">Често задавани въпроси</p>
    <h2 style="margin:0 0 18px;font-size:23px;color:#0f172a">Полезна информация</h2>
    <div style="display:grid;gap:14px">${items.map((item) => `<div><h3 style="margin:0 0 5px;font-size:16px;color:#0f172a">${escapeHtml(item.question)}</h3><p style="margin:0;line-height:1.65;font-size:14px">${escapeHtml(item.answer)}</p></div>`).join("")}</div>
  </div>
</section>`;
}

function linksSection(title, links) {
  const unique = [...new Map(links.filter((item) => item?.href && item?.label).map((item) => [item.href, item])).values()];
  if (!unique.length) return "";
  return `<nav data-seo-enhancer="internal-links" aria-label="${escapeHtml(title)}" style="border-top:1px solid #e2e8f0;background:#f8fafc;font-family:Arial,sans-serif">
  <div style="max-width:1280px;margin:0 auto;padding:24px 20px">
    <strong style="display:block;margin-bottom:10px;color:#0f172a">${escapeHtml(title)}</strong>
    <div style="display:flex;flex-wrap:wrap;gap:8px 16px">${unique.map((item) => `<a href="${escapeHtml(item.href)}" style="color:#0f766e;font-size:14px;font-weight:700">${escapeHtml(item.label)}</a>`).join("")}</div>
  </div>
</nav>`;
}

function appendSitemap(xml, entries) {
  const newRows = entries
    .filter((entry) => !xml.includes(`<loc>${escapeXml(canonical(entry.path))}</loc>`))
    .map((entry) => `  <url>\n    <loc>${escapeXml(canonical(entry.path))}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${entry.frequency || "weekly"}</changefreq>\n    <priority>${entry.priority || "0.6"}</priority>\n  </url>`)
    .join("\n");
  return newRows ? xml.replace("</urlset>", `${newRows}\n</urlset>`) : xml;
}

function categoryFaq(category, products, region = null) {
  const brandNames = [...new Set(products.map((product) => product.brand).filter(Boolean))].slice(0, 5);
  const area = region?.bg || "Русе, Силистра, Разград, Свищов, Бяла и Търговище";
  return [
    {
      question: region ? `Предлага ли HygiaTrade ${category.name} за ${region.bg}?` : `Какви продукти има в категория ${category.name}?`,
      answer: region
        ? `Да. HygiaTrade показва ${products.length} активни продукта в категория ${category.name} и обслужва ${region.bg} в рамките на своя район на дистрибуция.`
        : `В категория ${category.name} има ${products.length} активни продукта${brandNames.length ? ` от марки като ${brandNames.join(", ")}` : ""}.`,
    },
    {
      question: `Доставя ли HygiaTrade ${category.name} за бизнеса?`,
      answer: `Да. За ${category.name} могат да се правят запитвания за дома, магазини, офиси и бизнес клиенти в обслужвания район: ${area}.`,
    },
  ];
}

function brandFaq(brand, products) {
  const isSano = String(brand.name).toLowerCase() === "sano";
  return [
    {
      question: `Предлага ли HygiaTrade продукти ${brand.name}?`,
      answer: `Да. В актуалния каталог има ${products.length} активни продукта на марка ${brand.name}.`,
    },
    isSano
      ? {
          question: "За кои райони HygiaTrade е дистрибутор на SANO?",
          answer: "Хигия Трейд ООД е публикуван от SANO България като дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище.",
        }
      : {
          question: `Как мога да направя запитване за ${brand.name}?`,
          answer: "Можете да използвате страницата за контакти на HygiaTrade за наличности, количества и доставки за дома или бизнеса.",
        },
  ];
}

function productFaq(product) {
  const inStock = Number(product.quantity) > 0;
  const items = [
    {
      question: `Предлага ли HygiaTrade ${product.title}?`,
      answer: `${product.title} е част от актуалния каталог на HygiaTrade. ${inStock ? `Към последното обновяване са отчетени ${product.quantity} налични броя.` : "Към последното обновяване продуктът е без отчетена складова наличност; свържете се с HygiaTrade за доставка."}`,
    },
    {
      question: `Как мога да поръчам ${product.title}?`,
      answer: "Продуктът може да бъде поръчан през HygiaTrade или чрез директно запитване за количество, доставка и условия за бизнес клиенти.",
    },
  ];
  if (String(product.brand || "").toLowerCase() === "sano") {
    items.push({
      question: "Къде HygiaTrade доставя SANO?",
      answer: "HygiaTrade обслужва Русе, Силистра, Разград, Свищов, Бяла и Търговище за SANO продукти според публикуваната информация на SANO България.",
    });
  }
  return items;
}

async function enhanceProductPages(products, categories, brands) {
  const categoryById = new Map(categories.map((category) => [String(category.id), category]));
  const productByCategory = new Map();
  for (const product of products) {
    const key = String(product.categoryId || "");
    if (!productByCategory.has(key)) productByCategory.set(key, []);
    productByCategory.get(key).push(product);
  }

  let faqBlocks = 0;
  let internalLinkBlocks = 0;
  let sanoEntityPages = 0;

  for (const product of products) {
    const path = productPath(product);
    let html;
    try {
      html = await readRoute(path);
    } catch {
      continue;
    }

    const category = categoryById.get(String(product.categoryId));
    const related = (productByCategory.get(String(product.categoryId)) || [])
      .filter((candidate) => candidate.id !== product.id)
      .sort((a, b) => Number(String(b.brand || "").toLowerCase() === String(product.brand || "").toLowerCase()) - Number(String(a.brand || "").toLowerCase() === String(product.brand || "").toLowerCase()))
      .slice(0, 5);

    const links = [
      ...(category ? [{ href: categoryPath(category), label: category.name }] : []),
      ...(product.brand ? [{ href: brandPath(product.brand), label: `Марка ${product.brand}` }] : []),
      ...related.map((candidate) => ({ href: productPath(candidate), label: candidate.title })),
      { href: "/company-info/", label: "За Хигия Трейд ООД" },
    ];

    if (String(product.brand || "").toLowerCase() === "sano") {
      links.push({ href: "/sano/", label: "SANO дистрибуция" });
      REGIONS.slice(0, 4).forEach((region) => links.push({ href: `/sano/${region.slug}/`, label: `SANO ${region.bg}` }));
      html = addHead(
        html,
        `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="sano-entity">${JSON.stringify(sanoEntityGraph(path)).replace(/</g, "\\u003c")}</script>`,
        'data-seo-enhancer="sano-entity"'
      );
      sanoEntityPages += 1;
    }

    const faq = productFaq(product);
    html = addHead(html, `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="faq-schema">${JSON.stringify(faqSchema(faq)).replace(/</g, "\\u003c")}</script>`, 'data-seo-enhancer="faq-schema"');
    html = addBody(html, faqSection(faq), 'data-seo-enhancer="faq"');
    html = addBody(html, linksSection("Свързани страници и продукти", links), 'data-seo-enhancer="internal-links"');
    await writeRoute(path, html);
    faqBlocks += 1;
    internalLinkBlocks += 1;
  }

  return { faqBlocks, internalLinkBlocks, sanoEntityPages };
}

async function enhanceCollectionPages(products, categories, brands) {
  let faqBlocks = 0;
  let internalLinkBlocks = 0;

  for (const category of categories) {
    const categoryProducts = products.filter((product) => String(product.categoryId) === String(category.id));
    const path = categoryPath(category);
    try {
      let html = await readRoute(path);
      const faq = categoryFaq(category, categoryProducts);
      html = addHead(html, `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="faq-schema">${JSON.stringify(faqSchema(faq)).replace(/</g, "\\u003c")}</script>`, 'data-seo-enhancer="faq-schema"');
      html = addBody(html, faqSection(faq), 'data-seo-enhancer="faq"');
      const links = [
        ...categoryProducts.slice(0, 8).map((product) => ({ href: productPath(product), label: product.title })),
        ...[...new Set(categoryProducts.map((product) => product.brand).filter(Boolean))].slice(0, 4).map((brand) => ({ href: brandPath(brand), label: `Марка ${brand}` })),
        { href: "/company-info/", label: "Хигия Трейд ООД" },
      ];
      html = addBody(html, linksSection("Още от HygiaTrade", links), 'data-seo-enhancer="internal-links"');
      await writeRoute(path, html);
      faqBlocks += 1;
      internalLinkBlocks += 1;
    } catch {
      // The base generator may skip a route only when upstream data is unavailable.
    }
  }

  for (const brand of brands) {
    const brandProducts = products.filter((product) => String(product.brand || "").toLowerCase() === String(brand.name).toLowerCase());
    const path = brandPath(brand.name);
    try {
      let html = await readRoute(path);
      const faq = brandFaq(brand, brandProducts);
      html = addHead(html, `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="faq-schema">${JSON.stringify(faqSchema(faq)).replace(/</g, "\\u003c")}</script>`, 'data-seo-enhancer="faq-schema"');
      if (String(brand.name).toLowerCase() === "sano") {
        html = addHead(html, `<script type="application/ld+json" data-generated-seo="true" data-seo-enhancer="sano-entity">${JSON.stringify(sanoEntityGraph(path)).replace(/</g, "\\u003c")}</script>`, 'data-seo-enhancer="sano-entity"');
      }
      html = addBody(html, faqSection(faq), 'data-seo-enhancer="faq"');
      const links = [
        ...brandProducts.slice(0, 8).map((product) => ({ href: productPath(product), label: product.title })),
        ...(String(brand.name).toLowerCase() === "sano" ? REGIONS.map((region) => ({ href: `/sano/${region.slug}/`, label: `SANO ${region.bg}` })) : []),
        { href: "/company-info/", label: "Хигия Трейд ООД" },
      ];
      html = addBody(html, linksSection("Свързани страници", links), 'data-seo-enhancer="internal-links"');
      await writeRoute(path, html);
      faqBlocks += 1;
      internalLinkBlocks += 1;
    } catch {
      // Ignore missing base route.
    }
  }

  return { faqBlocks, internalLinkBlocks };
}

async function generateRegionalCategoryPages(template, products, categories) {
  const candidates = categories
    .map((category) => ({
      category,
      products: products.filter((product) => String(product.categoryId) === String(category.id)),
    }))
    .filter((entry) => entry.products.length >= MIN_REGIONAL_CATEGORY_PRODUCTS)
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, MAX_REGIONAL_CATEGORIES);

  const sitemapEntries = [];
  const indexNowUrls = [];
  let faqBlocks = 0;
  let internalLinkBlocks = 0;

  for (const { category, products: categoryProducts } of candidates) {
    const categoryBrands = [...new Set(categoryProducts.map((product) => product.brand).filter(Boolean))].slice(0, 8);
    for (const region of REGIONS) {
      const path = regionalCategoryPath(category, region);
      const title = `${category.name} за ${region.bg} | HygiaTrade`;
      const description = `Доставка и запитвания за ${category.name} в ${region.bg}. HygiaTrade предлага ${categoryProducts.length} активни продукта за дома, офиса, магазини и бизнес клиенти.`;
      const faq = categoryFaq(category, categoryProducts, region);
      const schema = [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: canonical(path),
          about: { "@type": "Thing", name: category.name },
          provider: { "@id": `${SITE_URL}/#organization` },
          spatialCoverage: { "@type": "City", name: region.bg },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: categoryProducts.slice(0, 30).map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.title,
              url: canonical(productPath(product)),
            })),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "HygiaTrade", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: category.name, item: canonical(categoryPath(category)) },
            { "@type": "ListItem", position: 3, name: region.bg, item: canonical(path) },
          ],
        },
        faqSchema(faq),
      ];

      let html = cleanHead(template);
      html = addHead(html, baseHead({ title, description, path, jsonLd: schema }), null);
      const productsList = categoryProducts.slice(0, 12).map((product) => `<li><a href="${escapeHtml(productPath(product))}" style="color:#0f766e;font-weight:700">${escapeHtml(product.title)}</a>${product.brand ? ` <span style="color:#64748b">· ${escapeHtml(product.brand)}</span>` : ""}</li>`).join("");
      const visible = `<main data-seo-enhancer="regional-category" style="border-top:1px solid #dbe3e8;background:#f8fafc;color:#334155;font-family:Arial,sans-serif">
  <div style="max-width:1280px;margin:0 auto;padding:36px 20px">
    <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#148f7c">${escapeHtml(region.bg)} · HygiaTrade</p>
    <h1 style="margin:0;font-size:30px;line-height:1.2;color:#0f172a">${escapeHtml(category.name)} за ${escapeHtml(region.bg)}</h1>
    <p style="max-width:950px;margin:14px 0 0;line-height:1.7">${escapeHtml(description)}</p>
    <p style="max-width:950px;margin:10px 0 0;line-height:1.7">Районът на HygiaTrade включва ${REGIONS.map((item) => item.bg).join(", ")}. Показаните артикули и наличности се извличат от актуалния продуктов каталог.</p>
    ${categoryBrands.length ? `<p style="margin:14px 0 0"><strong>Марки в категорията:</strong> ${escapeHtml(categoryBrands.join(", "))}</p>` : ""}
    <h2 style="margin:26px 0 10px;font-size:21px;color:#0f172a">Продукти</h2>
    <ul style="margin:0;padding-left:22px;display:grid;gap:7px">${productsList}</ul>
  </div>
</main>`;
      html = addBody(html, visible, 'data-seo-enhancer="regional-category"');
      html = addBody(html, faqSection(faq), 'data-seo-enhancer="faq"');
      html = addBody(html, linksSection("Свързани страници", [
        { href: categoryPath(category), label: category.name },
        ...REGIONS.filter((item) => item.slug !== region.slug).map((item) => ({ href: regionalCategoryPath(category, item), label: `${category.name} · ${item.bg}` })),
        { href: "/company-info/", label: "За Хигия Трейд" },
      ]), 'data-seo-enhancer="internal-links"');
      await writeRoute(path, html);
      sitemapEntries.push({ path, priority: "0.65", frequency: "weekly" });
      indexNowUrls.push(canonical(path));
      faqBlocks += 1;
      internalLinkBlocks += 1;
    }
  }

  return { pages: sitemapEntries.length, sitemapEntries, indexNowUrls, faqBlocks, internalLinkBlocks, categories: candidates.map((entry) => entry.category.name) };
}

async function generateCompanyInfoPage(template, products, categories, brands) {
  const path = "/company-info/";
  const sanoProducts = products.filter((product) => String(product.brand || "").toLowerCase() === "sano");
  const title = "Хигия Трейд ООД - фирмена информация, SANO и район на дистрибуция | HygiaTrade";
  const description = "Фактологична информация за Хигия Трейд ООД: адрес в Русе, контакти, продуктов каталог, SANO дистрибуция и обслужвани райони.";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      organizationEntity(),
      {
        "@type": "WebPage",
        "@id": `${canonical(path)}#webpage`,
        url: canonical(path),
        name: title,
        description,
        mainEntity: { "@id": `${SITE_URL}/#organization` },
        about: [
          { "@id": `${SITE_URL}/#organization` },
          { "@id": `${SITE_URL}/brands/sano/#brand` },
        ],
      },
      {
        "@type": "Brand",
        "@id": `${SITE_URL}/brands/sano/#brand`,
        name: "SANO",
        url: `${SITE_URL}/brands/sano/`,
        sameAs: ["https://sanobg.com/", "https://sanobg.com/buy/"],
      },
    ],
  };

  let html = cleanHead(template);
  html = addHead(html, baseHead({ title, description, path, jsonLd: schema }), null);
  const body = `<main data-seo-enhancer="company-info" style="border-top:1px solid #dbe3e8;background:#fff;color:#334155;font-family:Arial,sans-serif">
  <div style="max-width:1100px;margin:0 auto;padding:38px 20px">
    <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#148f7c">AI knowledge · company facts</p>
    <h1 style="margin:0;font-size:31px;color:#0f172a">Хигия Трейд ООД</h1>
    <p style="max-width:900px;margin:14px 0 0;line-height:1.75">HygiaTrade е онлайн каталогът на Хигия Трейд ООД. Фирмата е базирана в Русе и предлага перилни и почистващи препарати, хигиенни консумативи и професионални решения за дома и бизнеса.</p>
    <dl style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:24px 0 0">
      <div><dt style="font-weight:800;color:#0f172a">Адрес</dt><dd style="margin:5px 0 0">гр. Русе, ул. Акад. Михаил Арнаудов №3</dd></div>
      <div><dt style="font-weight:800;color:#0f172a">Телефон</dt><dd style="margin:5px 0 0">0888 822 861</dd></div>
      <div><dt style="font-weight:800;color:#0f172a">Имейл</dt><dd style="margin:5px 0 0">higiatrade@abv.bg</dd></div>
      <div><dt style="font-weight:800;color:#0f172a">Район</dt><dd style="margin:5px 0 0">${REGIONS.map((region) => region.bg).join(", ")}</dd></div>
    </dl>
    <h2 style="margin:30px 0 10px;font-size:22px;color:#0f172a">SANO</h2>
    <p style="max-width:900px;margin:0;line-height:1.75">SANO България публикува Хигия Трейд ООД като дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище. В актуалния каталог на HygiaTrade има ${sanoProducts.length} активни SANO продукта.</p>
    <p style="margin:12px 0 0"><a href="https://sanobg.com/buy/" style="color:#0f766e;font-weight:800">Официална страница на SANO България за дистрибутори</a></p>
    <h2 style="margin:30px 0 10px;font-size:22px;color:#0f172a">Каталог</h2>
    <p style="margin:0;line-height:1.75">Активни продукти: ${products.length}. Категории: ${categories.length}. Марки: ${brands.length}. Данните се обновяват автоматично при SEO build от продуктовата база.</p>
  </div>
</main>`;
  html = addBody(html, body, 'data-seo-enhancer="company-info"');
  html = addBody(html, linksSection("Основни ресурси", [
    { href: "/sano/", label: "SANO дистрибуция" },
    { href: "/products/", label: "Всички продукти" },
    { href: "/brands/", label: "Марки" },
    { href: "/contact/", label: "Контакти" },
    ...REGIONS.map((region) => ({ href: `/sano/${region.slug}/`, label: `SANO ${region.bg}` })),
  ]), 'data-seo-enhancer="internal-links"');
  await writeRoute(path, html);
  return path;
}

async function addVerificationToHomepage() {
  if (!GOOGLE_SITE_VERIFICATION && !BING_SITE_VERIFICATION) return;
  const path = "/";
  let html = await readRoute(path);
  html = html.replace(/<meta[^>]+data-seo-enhancer=["']verification["'][^>]*>\s*/gi, "");
  html = addHead(html, verificationMeta(), null);
  await writeRoute(path, html);
}

async function submitIndexNow(urls) {
  const uniqueUrls = [...new Set(urls)].slice(0, 10000);
  if (!uniqueUrls.length || !INDEXNOW_KEY) return { configured: false, submitted: 0, success: false };

  await writeFile(join(OUT_DIR, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY, "utf8");

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: uniqueUrls,
      }),
    });
    const success = response.ok || response.status === 202;
    if (!success) console.warn(`[seo] IndexNow returned ${response.status} ${response.statusText}`);
    else console.log(`[seo] IndexNow accepted ${uniqueUrls.length} URLs.`);
    return { configured: true, submitted: uniqueUrls.length, success, status: response.status };
  } catch (error) {
    console.warn(`[seo] IndexNow submission skipped after network error: ${error instanceof Error ? error.message : error}`);
    return { configured: true, submitted: uniqueUrls.length, success: false };
  }
}

async function main() {
  const template = await readRoute("/");
  const [products, categoriesPayload, brandsPayload] = await Promise.all([
    fetchAllProducts(),
    fetchJson(`${API_URL}/Categories`),
    fetchJson(`${API_URL}/Brands`),
  ]);
  const categories = Array.isArray(categoriesPayload) ? categoriesPayload.filter((item) => item?.id && item?.name) : [];
  const brands = Array.isArray(brandsPayload) ? brandsPayload.filter((item) => item?.id && item?.name) : [];

  const productEnhancement = await enhanceProductPages(products, categories, brands);
  const collectionEnhancement = await enhanceCollectionPages(products, categories, brands);
  const regional = await generateRegionalCategoryPages(template, products, categories);
  const companyInfoPath = await generateCompanyInfoPage(template, products, categories, brands);
  await addVerificationToHomepage();

  const sitemapPath = join(OUT_DIR, "sitemap.xml");
  let sitemap = await readFile(sitemapPath, "utf8");
  sitemap = appendSitemap(sitemap, [
    { path: companyInfoPath, priority: "0.8", frequency: "monthly" },
    ...regional.sitemapEntries,
  ]);
  await writeFile(sitemapPath, sitemap, "utf8");

  const llmsPath = join(OUT_DIR, "llms.txt");
  const currentLlms = await readFile(llmsPath, "utf8").catch(() => "# HygiaTrade\n");
  const extraLlms = `\n\n## Authoritative company knowledge\nCompany facts: ${canonical(companyInfoPath)}\nХигия Трейд ООД is based in Ruse, Bulgaria, at ул. Акад. Михаил Арнаудов №3.\nPhone: +359 888 822 861. Email: higiatrade@abv.bg.\nSANO Bulgaria lists Хигия Трейд ООД as distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte.\nOfficial reference: https://sanobg.com/buy/\n\n## Regional category pages\nThese pages are generated only for catalogue categories with at least ${MIN_REGIONAL_CATEGORY_PRODUCTS} active products, to avoid thin location pages.\n${regional.sitemapEntries.map((entry) => `- ${canonical(entry.path)}`).join("\n")}\n\n## Search-engine discovery\nMain sitemap: ${SITE_URL}/sitemap.xml\nImage sitemap: ${SITE_URL}/image-sitemap.xml\nGoogle Merchant XML: ${SITE_URL}/google-merchant.xml\n`;
  await writeFile(llmsPath, `${currentLlms.trimEnd()}${extraLlms}`, "utf8");

  const manifestPath = join(OUT_DIR, "seo-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const allSitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&"));
  const indexNow = await submitIndexNow(allSitemapUrls);
  const updatedManifest = {
    ...manifest,
    enhancedAt: new Date().toISOString(),
    regionalCategoryPages: regional.pages,
    regionalCategorySourceCategories: regional.categories,
    companyInfoPage: true,
    faqBlocks: productEnhancement.faqBlocks + collectionEnhancement.faqBlocks + regional.faqBlocks,
    internalLinkBlocks: productEnhancement.internalLinkBlocks + collectionEnhancement.internalLinkBlocks + regional.internalLinkBlocks + 1,
    sanoEntityPages: productEnhancement.sanoEntityPages + 1,
    googleVerificationConfigured: Boolean(GOOGLE_SITE_VERIFICATION),
    bingVerificationConfigured: Boolean(BING_SITE_VERIFICATION),
    indexNowConfigured: indexNow.configured,
    indexNowSubmittedUrls: indexNow.submitted,
    indexNowAccepted: indexNow.success,
    indexNowKeyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    minimumRegionalCategoryProducts: MIN_REGIONAL_CATEGORY_PRODUCTS,
  };
  await writeFile(manifestPath, JSON.stringify(updatedManifest, null, 2), "utf8");

  console.log(`[seo] advanced enhancement: ${regional.pages} regional-category pages, ${updatedManifest.faqBlocks} FAQ blocks, ${updatedManifest.internalLinkBlocks} internal-link blocks, ${updatedManifest.sanoEntityPages} SANO entity pages.`);
}

main().catch((error) => {
  console.error(`[seo] advanced enhancement failed: ${error instanceof Error ? error.stack || error.message : error}`);
  process.exitCode = 1;
});