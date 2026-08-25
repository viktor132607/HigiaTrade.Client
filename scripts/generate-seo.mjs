import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://higiatrade.com").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://higiatrade-server.onrender.com/api").replace(/\/$/, "");
const OUT_DIR = resolve(process.cwd(), "out");
const STRICT = process.env.SEO_STRICT === "1";
const TODAY = new Date().toISOString().slice(0, 10);

const REGIONS = [
  { slug: "ruse", bg: "Русе", en: "Ruse" },
  { slug: "silistra", bg: "Силистра", en: "Silistra" },
  { slug: "razgrad", bg: "Разград", en: "Razgrad" },
  { slug: "svishtov", bg: "Свищов", en: "Svishtov" },
  { slug: "byala", bg: "Бяла", en: "Byala" },
  { slug: "targovishte", bg: "Търговище", en: "Targovishte" },
];

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", frequency: "daily" },
  { path: "/sano/", priority: "1.0", frequency: "daily" },
  { path: "/products/", priority: "0.9", frequency: "daily" },
  { path: "/brands/", priority: "0.8", frequency: "weekly" },
  { path: "/about/", priority: "0.6", frequency: "monthly" },
  { path: "/contact/", priority: "0.7", frequency: "monthly" },
  { path: "/new-products/", priority: "0.7", frequency: "daily" },
  { path: "/promotions/", priority: "0.7", frequency: "daily" },
];

const CYRILLIC = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvCell(value = "") {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max = 160) {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function slugify(value, maxLength = 88) {
  const transliterated = String(value || "")
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = transliterated
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

function productPath(product) {
  return `/products/${entitySlug(product.title, product.id)}/`;
}

function categoryPath(category) {
  return `/categories/${entitySlug(category.name, category.id)}/`;
}

function brandPath(name) {
  return `/brands/${slugify(name, 100)}/`;
}

function canonical(path) {
  const normalized = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return `${SITE_URL}${normalized}`;
}

function seoImageUrl(url, descriptiveName) {
  if (!url) return "";
  const match = String(url).match(/^(.*\/api\/Images\/[0-9a-f-]{36})(?:\/[^?#]+)?([?#].*)?$/i);
  if (!match) return String(url);
  return `${match[1]}/${slugify(descriptiveName, 96)}${match[2] || ""}`;
}

function productImages(product) {
  const images = [];
  if (product.mainImageUrl) images.push(seoImageUrl(product.mainImageUrl, product.title));
  const secondary = Array.isArray(product.secondaryImages) ? product.secondaryImages : [];
  secondary.forEach((image, index) => {
    const uri = image?.uri || image?.url;
    if (uri) images.push(seoImageUrl(uri, `${product.title}-${index + 2}`));
  });
  return [...new Set(images.filter(Boolean))];
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, 1200 * attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function safeFetch(label, url, fallback) {
  try {
    return await fetchJson(url);
  } catch (error) {
    console.warn(`[seo] ${label} fetch failed: ${error instanceof Error ? error.message : error}`);
    if (STRICT) throw error;
    return fallback;
  }
}

async function fetchAllProducts() {
  const result = [];
  let page = 1;
  const pageSize = 100;
  let totalCount = Number.POSITIVE_INFINITY;

  while (result.length < totalCount && page <= 100) {
    const url = new URL(`${API_URL}/Products`);
    url.searchParams.set("PageNumber", String(page));
    url.searchParams.set("PageSize", String(pageSize));
    url.searchParams.set("SortBy", "title");
    url.searchParams.set("SortDescending", "false");

    const payload = await safeFetch(`products page ${page}`, url.toString(), null);
    if (!payload) break;

    const items = Array.isArray(payload.items) ? payload.items : [];
    totalCount = Number.isFinite(Number(payload.totalCount)) ? Number(payload.totalCount) : result.length + items.length;
    result.push(...items);
    if (items.length === 0 || items.length < pageSize) break;
    page += 1;
  }

  return result.filter((product) => product && product.id && product.title && product.isActive !== false);
}

function cleanTemplateHead(template) {
  return template
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, "")
    .replace(/<meta[^>]+property=["']og:(?:title|description|type|url|image)["'][^>]*>/gi, "")
    .replace(/<meta[^>]+name=["']twitter:(?:card|title|description|image)["'][^>]*>/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, "");
}

function pageHead({ title, description, path, image, type = "website", jsonLd }) {
  const url = canonical(path);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(truncate(description, 165));
  const imageUrl = image || `${SITE_URL}/higiqlogo.png`;
  const schema = Array.isArray(jsonLd) ? jsonLd : [jsonLd].filter(Boolean);

  return `\n<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:site_name" content="HygiaTrade" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:type" content="${escapeHtml(type)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
${schema.map((item) => `<script type="application/ld+json" data-generated-seo="true">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`).join("\n")}\n`;
}

function seoSection({ eyebrow, heading, body, details = [], links = [] }) {
  const detailItems = details
    .filter((item) => item && item.label && item.value)
    .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`)
    .join("");
  const linkItems = links
    .filter((item) => item && item.href && item.label)
    .map((item) => `<a href="${escapeHtml(item.href)}" style="color:#0f766e;font-weight:700;margin-right:16px">${escapeHtml(item.label)}</a>`)
    .join("");

  return `\n<section data-generated-seo="true" aria-label="SEO summary" style="border-top:1px solid #dbe3e8;background:#f8fafc;color:#263b4d;font-family:Arial,sans-serif">
  <div style="max-width:1280px;margin:0 auto;padding:32px 20px">
    <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#148f7c">${escapeHtml(eyebrow)}</p>
    <h2 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a">${escapeHtml(heading)}</h2>
    <p style="max-width:960px;margin:12px 0 0;line-height:1.7;font-size:15px">${escapeHtml(body)}</p>
    ${detailItems ? `<ul style="margin:18px 0 0;padding-left:20px;line-height:1.8;font-size:14px">${detailItems}</ul>` : ""}
    ${linkItems ? `<p style="margin:18px 0 0;font-size:14px">${linkItems}</p>` : ""}
  </div>
</section>\n`;
}

function buildHtml(template, head, section) {
  let html = cleanTemplateHead(template);
  html = html.replace("</head>", `${head}</head>`);
  html = html.replace("</body>", `${section}</body>`);
  return html;
}

async function writeRoute(path, html) {
  const relative = path === "/" ? "" : path.replace(/^\/+|\/+$/g, "");
  const targetDir = join(OUT_DIR, relative);
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, "index.html"), html, "utf8");
}

function sellerSchema() {
  return {
    "@type": "Organization",
    name: "Хигия Трейд ООД",
    alternateName: "HygiaTrade",
    url: SITE_URL,
    telephone: "+359888822861",
    email: "higiatrade@abv.bg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Акад. Михаил Арнаудов №3",
      addressLocality: "Русе",
      addressCountry: "BG",
    },
  };
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

function productSchema(product) {
  const price = Number(product.discountedPrice) > 0 ? Number(product.discountedPrice) : Number(product.regularPrice || 0);
  const currency = product.currencyCode || "EUR";
  const url = canonical(productPath(product));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: truncate(product.description, 1200),
    image: productImages(product),
    sku: String(product.id),
    category: product.categoryName || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: Number(product.quantity) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: sellerSchema(),
    },
  };
}

function categorySchema(category, products) {
  const path = categoryPath(category);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} | HygiaTrade`,
    url: canonical(path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.slice(0, 50).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonical(productPath(product)),
        name: product.title,
      })),
    },
  };
}

function brandSchema(brand, products) {
  const path = brandPath(brand.name);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Brand",
      name: brand.name,
      description: truncate(brand.description || `${brand.name} products available from HygiaTrade.`, 600),
      url: canonical(path),
      logo: brand.thumbnailImageUrl ? seoImageUrl(brand.thumbnailImageUrl, `${brand.name}-logo`) : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${brand.name} | HygiaTrade`,
      url: canonical(path),
      about: { "@type": "Brand", name: brand.name },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.slice(0, 50).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: canonical(productPath(product)),
          name: product.title,
        })),
      },
    },
  ];
}

function regionSchema(region) {
  const path = `/sano/${region.slug}/`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `SANO дистрибутор за ${region.bg} | HygiaTrade`,
      url: canonical(path),
      about: { "@type": "Brand", name: "SANO" },
      mainEntity: {
        ...sellerSchema(),
        areaServed: { "@type": "City", name: region.bg },
        brand: { "@type": "Brand", name: "SANO" },
        subjectOf: {
          "@type": "WebPage",
          url: "https://sanobg.com/buy/",
          name: "SANO България - дистрибутори",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Кой е дистрибуторът на SANO за ${region.bg}?`,
          acceptedAnswer: { "@type": "Answer", text: `Хигия Трейд ООД обслужва ${region.bg} като част от публикувания район за дистрибуция на SANO България.` },
        },
        {
          "@type": "Question",
          name: `Мога ли да поръчам SANO препарати за фирма в ${region.bg}?`,
          acceptedAnswer: { "@type": "Answer", text: "Да. HygiaTrade приема запитвания за SANO перилни и почистващи препарати за магазини, офиси, фирми и домакинства." },
        },
      ],
    },
    breadcrumbSchema([
      { name: "HygiaTrade", path: "/" },
      { name: "SANO", path: "/sano/" },
      { name: region.bg, path },
    ]),
  ];
}

function sitemapXml(entries) {
  const unique = [...new Map(entries.map((entry) => [canonical(entry.path), entry])).values()];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
    .map((entry) => `  <url>\n    <loc>${escapeXml(canonical(entry.path))}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${entry.frequency || "weekly"}</changefreq>\n    <priority>${entry.priority || "0.5"}</priority>\n  </url>`)
    .join("\n")}\n</urlset>\n`;
}

function imageSitemapXml(products) {
  const rows = products
    .map((product) => {
      const images = productImages(product);
      if (images.length === 0) return "";
      return `  <url>\n    <loc>${escapeXml(canonical(productPath(product)))}</loc>\n${images
        .map((image, index) => `    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n      <image:title>${escapeXml(index === 0 ? product.title : `${product.title} - ${index + 1}`)}</image:title>\n    </image:image>`)
        .join("\n")}\n  </url>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows}\n</urlset>\n`;
}

function merchantXml(products) {
  const items = products.map((product) => {
    const price = Number(product.regularPrice || 0);
    const salePrice = Number(product.discountedPrice || 0);
    const currency = product.currencyCode || "EUR";
    const mainImage = productImages(product)[0] || `${SITE_URL}/higiqlogo.png`;
    return `    <item>\n      <g:id>${escapeXml(product.id)}</g:id>\n      <title>${escapeXml(product.title)}</title>\n      <description>${escapeXml(truncate(product.description, 5000))}</description>\n      <link>${escapeXml(canonical(productPath(product)))}</link>\n      <g:image_link>${escapeXml(mainImage)}</g:image_link>\n      <g:availability>${Number(product.quantity) > 0 ? "in_stock" : "out_of_stock"}</g:availability>\n      <g:condition>new</g:condition>\n      <g:price>${price.toFixed(2)} ${escapeXml(currency)}</g:price>\n${salePrice > 0 && salePrice < price ? `      <g:sale_price>${salePrice.toFixed(2)} ${escapeXml(currency)}</g:sale_price>\n` : ""}${product.brand ? `      <g:brand>${escapeXml(product.brand)}</g:brand>\n` : ""}${product.categoryName ? `      <g:product_type>${escapeXml(product.categoryName)}</g:product_type>\n` : ""}      <g:identifier_exists>false</g:identifier_exists>\n    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n  <channel>\n    <title>HygiaTrade product feed</title>\n    <link>${escapeXml(SITE_URL)}</link>\n    <description>HygiaTrade cleaning, laundry and hygiene products</description>\n${items}\n  </channel>\n</rss>\n`;
}

function merchantCsv(products) {
  const header = ["id", "title", "description", "link", "image_link", "availability", "condition", "price", "sale_price", "brand", "product_type", "identifier_exists"];
  const rows = products.map((product) => {
    const price = Number(product.regularPrice || 0);
    const salePrice = Number(product.discountedPrice || 0);
    const currency = product.currencyCode || "EUR";
    const mainImage = productImages(product)[0] || `${SITE_URL}/higiqlogo.png`;
    return [
      product.id,
      product.title,
      truncate(product.description, 5000),
      canonical(productPath(product)),
      mainImage,
      Number(product.quantity) > 0 ? "in_stock" : "out_of_stock",
      "new",
      `${price.toFixed(2)} ${currency}`,
      salePrice > 0 && salePrice < price ? `${salePrice.toFixed(2)} ${currency}` : "",
      product.brand || "",
      product.categoryName || "",
      "false",
    ].map(csvCell).join(",");
  });
  return `${header.map(csvCell).join(",")}\n${rows.join("\n")}\n`;
}

function llmsText(products, categories, brands) {
  const sanoProducts = products.filter((product) => String(product.brand || "").toLowerCase() === "sano");
  return `# HygiaTrade\n\nHygiaTrade is the online catalogue of Хигия Трейд ООД, based in Ruse, Bulgaria.\n\n## SANO distribution\nХигия Трейд ООД is listed by SANO Bulgaria as distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte.\nOfficial distributor reference: https://sanobg.com/buy/\nSANO landing page: ${SITE_URL}/sano/\nRegional pages:\n${REGIONS.map((region) => `- ${region.bg}: ${SITE_URL}/sano/${region.slug}/`).join("\n")}\n\n## Catalogue\nActive products: ${products.length}\nCategories: ${categories.length}\nBrands: ${brands.length}\nSANO products: ${sanoProducts.length}\nProduct feed XML: ${SITE_URL}/google-merchant.xml\nProduct feed CSV: ${SITE_URL}/google-merchant.csv\nImage sitemap: ${SITE_URL}/image-sitemap.xml\n\n## Brands\n${brands.slice(0, 100).map((brand) => `- ${brand.name}: ${canonical(brandPath(brand.name))}`).join("\n")}\n\n## Categories\n${categories.slice(0, 100).map((category) => `- ${category.name}: ${canonical(categoryPath(category))}`).join("\n")}\n\n## Product URLs\n${products.slice(0, 500).map((product) => `- ${product.title}: ${canonical(productPath(product))}`).join("\n")}\n\n## Contact\nAddress: гр. Русе, ул. Акад. Михаил Арнаудов №3\nPhone: +359 888 822 861\nEmail: higiatrade@abv.bg\nWebsite: ${SITE_URL}/\n`;
}

async function main() {
  const template = await readFile(join(OUT_DIR, "index.html"), "utf8");
  const [products, categoriesPayload, brandsPayload] = await Promise.all([
    fetchAllProducts(),
    safeFetch("categories", `${API_URL}/Categories`, []),
    safeFetch("brands", `${API_URL}/Brands`, []),
  ]);

  const categories = Array.isArray(categoriesPayload) ? categoriesPayload.filter((item) => item?.id && item?.name) : [];
  const brands = Array.isArray(brandsPayload) ? brandsPayload.filter((item) => item?.id && item?.name) : [];
  const categoryById = new Map(categories.map((category) => [String(category.id), category]));
  const sitemapEntries = [...STATIC_ROUTES];

  for (const product of products) {
    const category = categoryById.get(String(product.categoryId));
    const path = productPath(product);
    const description = truncate(product.description || `${product.title} от HygiaTrade.`, 165);
    const price = Number(product.discountedPrice) > 0 ? Number(product.discountedPrice) : Number(product.regularPrice || 0);
    const currency = product.currencyCode || "EUR";
    const breadcrumbs = [{ name: "HygiaTrade", path: "/" }];
    if (category) breadcrumbs.push({ name: category.name, path: categoryPath(category) });
    if (product.brand) breadcrumbs.push({ name: product.brand, path: brandPath(product.brand) });
    breadcrumbs.push({ name: product.title, path });

    const head = pageHead({
      title: `${product.title} | HygiaTrade`,
      description,
      path,
      image: productImages(product)[0] || undefined,
      type: "product",
      jsonLd: [productSchema(product), breadcrumbSchema(breadcrumbs)],
    });
    const section = seoSection({
      eyebrow: product.brand ? `Марка ${product.brand}` : "HygiaTrade продукт",
      heading: product.title,
      body: truncate(product.description || "Продукт от каталога на HygiaTrade.", 650),
      details: [
        { label: "Категория", value: product.categoryName || "Продукти" },
        { label: "Марка", value: product.brand || "HygiaTrade" },
        { label: "Цена", value: price > 0 ? `${price.toFixed(2)} ${currency}` : "По запитване" },
        { label: "Наличност", value: Number(product.quantity) > 0 ? "В наличност" : "Проверете за доставка" },
      ],
      links: [
        ...(category ? [{ href: categoryPath(category), label: category.name }] : []),
        ...(product.brand ? [{ href: brandPath(product.brand), label: `Още от ${product.brand}` }] : []),
        { href: "/contact/", label: "Запитване" },
      ],
    });
    await writeRoute(path, buildHtml(template, head, section));
    sitemapEntries.push({ path, priority: "0.8", frequency: "weekly" });
  }

  for (const category of categories) {
    const categoryProducts = products.filter((product) => String(product.categoryId) === String(category.id));
    const path = categoryPath(category);
    const description = `Разгледайте ${category.name} в HygiaTrade. ${categoryProducts.length} активни продукта за дома, офиса и бизнеса.`;
    const image = category.imageURI || category.imageUri || category.thumbnailImageUrl || "";
    const head = pageHead({
      title: `${category.name} - почистващи и хигиенни продукти | HygiaTrade`,
      description,
      path,
      image: image ? seoImageUrl(image, category.name) : undefined,
      jsonLd: [
        categorySchema(category, categoryProducts),
        breadcrumbSchema([
          { name: "HygiaTrade", path: "/" },
          { name: "Продукти", path: "/products/" },
          { name: category.name, path },
        ]),
      ],
    });
    const section = seoSection({
      eyebrow: "Категория HygiaTrade",
      heading: category.name,
      body: description,
      details: [{ label: "Активни продукти", value: String(categoryProducts.length) }],
      links: categoryProducts.slice(0, 12).map((product) => ({ href: productPath(product), label: product.title })),
    });
    await writeRoute(path, buildHtml(template, head, section));
    sitemapEntries.push({ path, priority: "0.7", frequency: "weekly" });
  }

  for (const brand of brands) {
    const brandProducts = products.filter((product) => String(product.brand || "").toLowerCase() === String(brand.name).toLowerCase());
    const path = brandPath(brand.name);
    const isSano = String(brand.name).toLowerCase() === "sano";
    const title = isSano ? "SANO препарати и дистрибуция | HygiaTrade" : `${brand.name} - продукти | HygiaTrade`;
    const description = isSano
      ? "SANO перилни и почистващи препарати от HygiaTrade. Дистрибуция за Русе, Силистра, Разград, Свищов, Бяла и Търговище."
      : `${brand.name} продукти от каталога на HygiaTrade за дома, офиса и бизнеса.`;
    const head = pageHead({
      title,
      description,
      path,
      image: brand.thumbnailImageUrl ? seoImageUrl(brand.thumbnailImageUrl, `${brand.name}-logo`) : undefined,
      jsonLd: [
        ...brandSchema(brand, brandProducts),
        breadcrumbSchema([
          { name: "HygiaTrade", path: "/" },
          { name: "Марки", path: "/brands/" },
          { name: brand.name, path },
        ]),
      ],
    });
    const section = seoSection({
      eyebrow: "Марка в HygiaTrade",
      heading: brand.name,
      body: brand.description ? truncate(brand.description, 650) : description,
      details: [{ label: "Активни продукти", value: String(brandProducts.length) }],
      links: brandProducts.slice(0, 12).map((product) => ({ href: productPath(product), label: product.title })),
    });
    await writeRoute(path, buildHtml(template, head, section));
    sitemapEntries.push({ path, priority: isSano ? "0.9" : "0.7", frequency: "weekly" });
  }

  const sanoProducts = products.filter((product) => String(product.brand || "").toLowerCase() === "sano");
  for (const region of REGIONS) {
    const path = `/sano/${region.slug}/`;
    const description = `Хигия Трейд ООД - SANO дистрибутор за ${region.bg}. Перилни и почистващи препарати SANO за дома, магазини, офиси и бизнес клиенти.`;
    const head = pageHead({
      title: `SANO дистрибутор за ${region.bg} | HygiaTrade`,
      description,
      path,
      jsonLd: regionSchema(region),
    });
    const section = seoSection({
      eyebrow: `SANO · ${region.bg}`,
      heading: `SANO дистрибутор за ${region.bg}`,
      body: `${description} Хигия Трейд ООД е базирана в Русе и обслужва ${region.bg} като част от официално публикувания район на SANO България.`,
      details: [
        { label: "Марка", value: "SANO" },
        { label: "Район", value: region.bg },
        { label: "SANO продукти в каталога", value: String(sanoProducts.length) },
      ],
      links: [
        { href: "/sano/", label: "SANO в HygiaTrade" },
        { href: "/contact/", label: `Запитване за доставка в ${region.bg}` },
        { href: "https://sanobg.com/buy/", label: "SANO България - дистрибутори" },
      ],
    });
    await writeRoute(path, buildHtml(template, head, section));
    sitemapEntries.push({ path, priority: "0.9", frequency: "weekly" });
  }

  {
    const path = "/sano/";
    const title = "SANO дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище | HygiaTrade";
    const description = "Хигия Трейд ООД е дистрибутор на SANO за Русе, Силистра, Разград, Свищов, Бяла и Търговище. SANO перилни и почистващи препарати за дома и бизнеса.";
    const head = pageHead({
      title,
      description,
      path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          url: canonical(path),
          about: { "@type": "Brand", name: "SANO" },
          mainEntity: {
            ...sellerSchema(),
            brand: { "@type": "Brand", name: "SANO" },
            areaServed: REGIONS.map((region) => ({ "@type": "City", name: region.bg })),
            subjectOf: { "@type": "WebPage", url: "https://sanobg.com/buy/" },
          },
        },
        breadcrumbSchema([
          { name: "HygiaTrade", path: "/" },
          { name: "SANO", path },
        ]),
      ],
    });
    const section = seoSection({
      eyebrow: "SANO · HygiaTrade",
      heading: "SANO дистрибуция за Русе и региона",
      body: description,
      details: [
        { label: "Район", value: REGIONS.map((region) => region.bg).join(", ") },
        { label: "SANO продукти в каталога", value: String(sanoProducts.length) },
      ],
      links: REGIONS.map((region) => ({ href: `/sano/${region.slug}/`, label: region.bg })),
    });
    await writeRoute(path, buildHtml(template, head, section));
  }

  await writeFile(join(OUT_DIR, "sitemap.xml"), sitemapXml(sitemapEntries), "utf8");
  await writeFile(join(OUT_DIR, "image-sitemap.xml"), imageSitemapXml(products), "utf8");
  await writeFile(join(OUT_DIR, "google-merchant.xml"), merchantXml(products), "utf8");
  await writeFile(join(OUT_DIR, "google-merchant.csv"), merchantCsv(products), "utf8");
  await writeFile(join(OUT_DIR, "llms.txt"), llmsText(products, categories, brands), "utf8");

  const imageCount = products.reduce((total, product) => total + productImages(product).length, 0);
  await writeFile(
    join(OUT_DIR, "seo-manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        siteUrl: SITE_URL,
        apiUrl: API_URL,
        products: products.length,
        categories: categories.length,
        brands: brands.length,
        regionalPages: REGIONS.length,
        generatedRoutes: [...new Set(sitemapEntries.map((entry) => canonical(entry.path)))].length,
        productFeedItems: products.length,
        images: imageCount,
        feeds: ["sitemap.xml", "image-sitemap.xml", "google-merchant.xml", "google-merchant.csv", "llms.txt"],
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`[seo] generated ${products.length} product pages, ${categories.length} category pages, ${brands.length} brand pages, ${REGIONS.length} SANO regional pages, product feeds and ${imageCount} image references.`);
}

main().catch((error) => {
  console.error(`[seo] generation failed: ${error instanceof Error ? error.stack || error.message : error}`);
  process.exitCode = 1;
});