import React, { useEffect, useState } from "react";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type StockEntry = {
  id: string;
  quantity: number;
  invoiceNumber: string;
  createdOn: string;
};

type Props = {
  token: string | null;
  productId: string;
  currentQuantity: number;
  onQuantityChange: (quantity: number) => void;
};

const ProductStockManager = ({ token, productId, currentQuantity, onQuantityChange }: Props) => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [quantity, setQuantity] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Inventory/${productId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!response.ok) throw new Error(isBg ? "Историята на наличността не можа да бъде заредена." : "Stock history could not be loaded.");
        const data = await response.json();
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        const loadedQuantity = Number(data.currentQuantity);
        if (Number.isFinite(loadedQuantity)) onQuantityChange(loadedQuantity);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : isBg ? "Историята на наличността не можа да бъде заредена." : "Stock history could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [productId, token]);

  const addStock = async () => {
    const parsedQuantity = Number.parseInt(quantity, 10);
    const invoice = invoiceNumber.trim();
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError(isBg ? "Въведи количество по-голямо от 0." : "Enter a quantity greater than 0.");
      return;
    }
    if (!invoice) {
      setError(isBg ? "Въведи номер на фактурата." : "Enter an invoice number.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Inventory/${productId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ quantity: parsedQuantity, invoiceNumber: invoice }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || (isBg ? "Количеството не можа да бъде добавено." : "Stock could not be added."));
      const newQuantity = Number(data?.currentQuantity);
      if (Number.isFinite(newQuantity)) onQuantityChange(newQuantity);
      if (data?.entry) setEntries((previous) => [data.entry, ...previous]);
      setQuantity("");
      setInvoiceNumber("");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : isBg ? "Количеството не можа да бъде добавено." : "Stock could not be added.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50/60 p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-sm font-semibold text-gray-800">{isBg ? "Наличност" : "Stock"}</div><div className="mt-1 text-3xl font-bold text-gray-950">{currentQuantity}</div></div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{isBg ? "текущо количество" : "current quantity"}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
        <label className="grid gap-1 text-sm font-semibold text-gray-800">{isBg ? "Добави количество" : "Add quantity"}<input type="number" inputMode="numeric" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={isBg ? "Напр. 24" : "E.g. 24"} className="min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20" /></label>
        <label className="grid gap-1 text-sm font-semibold text-gray-800">{isBg ? "Фактура №" : "Invoice no."}<input type="text" maxLength={100} value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder={isBg ? "Напр. 0000123456 / 24.08.2026" : "E.g. 0000123456 / 24.08.2026"} className="min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20" /></label>
        <button type="button" onClick={() => void addStock()} disabled={adding} className="min-h-11 rounded-md bg-[#18b99f] px-5 py-2 font-semibold text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50">{adding ? (isBg ? "Добавяне..." : "Adding...") : (isBg ? "+ Добави" : "+ Add")}</button>
      </div>

      <p className="mt-2 text-xs text-gray-500">{isBg ? "При добавяне наличността се увеличава и записът остава свързан с фактурата." : "Adding stock increases the quantity and keeps the receipt linked to its invoice."}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="mb-2 text-sm font-semibold text-gray-800">{isBg ? "История на зарежданията" : "Stock receipt history"}</div>
        {loading ? (
          <div className="py-3 text-sm text-gray-500">{isBg ? "Зареждане..." : "Loading..."}</div>
        ) : entries.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-gray-500">{isBg ? "Все още няма записани зареждания." : "No stock receipts recorded yet."}</div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">{isBg ? "Дата" : "Date"}</th><th className="px-3 py-2">{isBg ? "Фактура" : "Invoice"}</th><th className="px-3 py-2 text-right">{isBg ? "Добавено" : "Added"}</th></tr></thead>
              <tbody className="divide-y divide-slate-200">{entries.map((entry) => <tr key={entry.id}><td className="px-3 py-2 text-gray-600">{new Date(entry.createdOn).toLocaleString(isBg ? "bg-BG" : "en-GB")}</td><td className="px-3 py-2 font-medium text-gray-900">{entry.invoiceNumber}</td><td className="px-3 py-2 text-right font-semibold text-emerald-700">+{entry.quantity}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStockManager;
