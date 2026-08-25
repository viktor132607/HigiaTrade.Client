import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type IncompleteProduct = { id: string; title: string };
const MARKER = "[INVOICE_IMPORT_INCOMPLETE]";

const collect = (value: unknown): IncompleteProduct[] => {
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const description = String(o.description ?? o.Description ?? "");
    if (!description.includes(MARKER)) return [];
    const id = String(o.id ?? o.Id ?? "");
    const title = String(o.title ?? o.Title ?? "").trim();
    return id && title ? [{ id, title }] : [];
  });
  if (!value || typeof value !== "object") return [];
  const o = value as Record<string, unknown>;
  for (const key of ["items", "Items", "products", "Products", "data", "Data", "result", "Result"]) {
    const found = collect(o[key]);
    if (found.length) return found;
  }
  return [];
};

const ProductIncompleteNotice = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [items, setItems] = useState<IncompleteProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const payload = await response.json().catch(() => null);
        if (!response.ok || cancelled) return;
        setItems(collect(payload));
      } catch { }
    };
    void load();
    return () => { cancelled = true; };
  }, [token]);

  if (!items.length) return null;
  return <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
    <div className="font-black">{isBg ? `${items.length} продукта от фактури чакат допълване` : `${items.length} invoice products need completion`}</div>
    <div className="mt-1 text-sm font-semibold">{items.slice(0, 8).map((item) => item.title).join(" · ")}{items.length > 8 ? ` · +${items.length - 8}` : ""}</div>
  </div>;
};

export default ProductIncompleteNotice;
