const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export const slugifySeo = (value: string, maxLength = 88) => {
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
};

export const entitySeoSlug = (name: string, id: string) => {
  const token = String(id || "").replace(/-/g, "").slice(0, 8).toLowerCase();
  return `${slugifySeo(name)}-${token || "item"}`;
};

export const productSeoPath = (product: { id: string; title: string }) =>
  `/products/${entitySeoSlug(product.title, product.id)}`;

export const categorySeoPath = (category: { id: string; name: string }) =>
  `/categories/${entitySeoSlug(category.name, category.id)}`;

export const brandSeoPath = (brandName: string) =>
  `/brands/${slugifySeo(brandName, 100)}`;

const DEFAULT_PRODUCT_IMAGE = "/higiqlogo.png";
const DEFAULT_IMAGE_CACHE_VERSION = "20260827-1";

export const seoImageUrl = (
  url: string | null | undefined,
  _descriptiveName: string,
  usesDefaultImage = false
) => {
  // Keep real product image URLs exactly as returned by the API.
  // Virtual brand defaults get a cache key so a previously cached failed request
  // cannot leave every product using the same brand logo with a broken image.
  const resolved = url?.trim() || DEFAULT_PRODUCT_IMAGE;
  if (!usesDefaultImage || resolved.startsWith("/")) return resolved;

  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}defaultImage=${DEFAULT_IMAGE_CACHE_VERSION}`;
};
