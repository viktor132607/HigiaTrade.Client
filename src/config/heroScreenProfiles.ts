// CSS viewport widths (not physical screen pixels).
// A website cannot reliably identify an iPhone/iPad/Mac model; public Home
// uses the closest viewport profile, while the editor uses the exact preset.
export const heroScreenProfiles = [
  { key: "mobile", category: "standard", width: 390, labelBg: "Телефон", labelEn: "Phone" },
  { key: "laptop", category: "standard", width: 1366, labelBg: "Лаптоп", labelEn: "Laptop" },
  { key: "monitor24", category: "standard", width: 1920, labelBg: 'Монитор 24″', labelEn: 'Monitor 24″' },
  { key: "monitor27", category: "standard", width: 2560, labelBg: 'Монитор 27″', labelEn: 'Monitor 27″' },
  { key: "iphoneSE", category: "apple", width: 375, labelBg: "iPhone SE", labelEn: "iPhone SE" },
  { key: "iphone15", category: "apple", width: 393, labelBg: "iPhone 15 / 16", labelEn: "iPhone 15 / 16" },
  { key: "iphonePro", category: "apple", width: 402, labelBg: "iPhone 16 / 17 Pro", labelEn: "iPhone 16 / 17 Pro" },
  { key: "iphoneProMax", category: "apple", width: 440, labelBg: "iPhone 16 / 17 Pro Max", labelEn: "iPhone 16 / 17 Pro Max" },
  { key: "ipadMini", category: "apple", width: 744, labelBg: "iPad mini", labelEn: "iPad mini" },
  { key: "ipad11", category: "apple", width: 820, labelBg: "iPad 11″ / Air 11″", labelEn: "iPad 11″ / Air 11″" },
  { key: "ipadPro11", category: "apple", width: 834, labelBg: "iPad Pro 11″", labelEn: "iPad Pro 11″" },
  { key: "ipad13", category: "apple", width: 1032, labelBg: "iPad Air / Pro 13″", labelEn: "iPad Air / Pro 13″" },
  { key: "macbookAir13", category: "apple", width: 1280, labelBg: "MacBook Air 13″", labelEn: "MacBook Air 13″" },
  { key: "macbookAir15", category: "apple", width: 1440, labelBg: "MacBook Air 15″", labelEn: "MacBook Air 15″" },
  { key: "macbookPro14", category: "apple", width: 1512, labelBg: "MacBook Pro 14″", labelEn: "MacBook Pro 14″" },
  { key: "macbookPro16", category: "apple", width: 1728, labelBg: "MacBook Pro 16″", labelEn: "MacBook Pro 16″" },
  { key: "imac24", category: "apple", width: 1920, labelBg: "iMac 24″", labelEn: "iMac 24″" },
  { key: "tabletSmall", category: "tablet", width: 768, labelBg: "Таблет 8″", labelEn: "8″ tablet" },
  { key: "tabletMedium", category: "tablet", width: 800, labelBg: "Таблет 10″", labelEn: "10″ tablet" },
  { key: "tabletLarge", category: "tablet", width: 1024, labelBg: "Таблет 11″", labelEn: "11″ tablet" },
  { key: "tabletXL", category: "tablet", width: 1200, labelBg: "Таблет 12–14″", labelEn: "12–14″ tablet" },
] as const;

export type HeroScreenMode = (typeof heroScreenProfiles)[number]["key"];
export type HeroScreenCategory = (typeof heroScreenProfiles)[number]["category"];

export const resolveHeroScreenMode = (width: number): HeroScreenMode => {
  const sorted = [...heroScreenProfiles].sort((a, b) =>
    Math.abs(a.width - width) - Math.abs(b.width - width));
  return sorted[0]?.key ?? "laptop";
};
