export interface ProductPackagingOption {
  id?: string;
  label: string;
  unitsPerPackage: number;
  priceInclVat: number;
  stockQuantity: number;
  isDefault: boolean;
  sortOrder?: number;
}

export const newPackagingOptions = (productTitle = ""): ProductPackagingOption[] => {
  const sano = /sano oxygen baby gel/i.test(productTitle);
  const labels = sano
    ? ["1 л", "3 л", "Кашон 12 × 1 л", "Кашон 20 × 3 л"]
    : ["Единична опаковка", "Опаковка 3 бр.", "Кашон 12 бр.", "Кашон 20 бр."];
  return labels.map((label, index) => ({
    label,
    unitsPerPackage: [1, 3, 12, 60][index],
    priceInclVat: 0,
    stockQuantity: 0,
    isDefault: index === 0,
    sortOrder: index,
  }));
};
