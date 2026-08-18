const euroCurrencyFormatter = new Intl.NumberFormat(["de-DE", "en-EU"], {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number | null | undefined): string => {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return euroCurrencyFormatter.format(amount);
};
