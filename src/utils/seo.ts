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

export const seoImageUrl = (url: string | null | undefined, descriptiveName: string) => {
  if (!url) return "/placeholder-image.jpg";

  const match = url.match(/^(.*\/api\/Images\/[0-9a-f-]{36})(?:\/[^?#]+)?([?#].*)?$/i);
  if (!match) return url;

  return `${match[1]}/${slugifySeo(descriptiveName, 96)}${match[2] || ""}`;
};
