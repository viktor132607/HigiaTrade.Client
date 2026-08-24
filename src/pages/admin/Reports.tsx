import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Summary {
  totalProducts: number;
  totalUnitsInStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  receivedUnits: number;
  soldUnits: number;
  totalOrders: number;
  revenue: number;
}

interface InventoryRow {
  productId: string;
  productName: string;
  categoryName: string;
  currentQuantity: number;
  receivedQuantity: number;
  soldQuantity: number;
  netMovement: number;
}

interface SalesRow {
  productId: string;
  productName: string;
  soldQuantity: number;
  revenue: number;
  orderCount: number;
}

interface StockEntryRow {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  invoiceNumber: string;
  createdOn: string;
}

interface ReportResponse {
  from: string;
  to: string;
  lowStockThreshold: number;
  summary: Summary;
  categories: string[];
  inventory: InventoryRow[];
  sales: SalesRow[];
  stockEntries: StockEntryRow[];
}

type Tab = "inventory" | "sales" | "receipts";

const PAGE_OPTIONS = [20, 50, 100];
const PAGE_STORAGE_KEY = "adminReportsPageSize";

const dateToInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultFrom = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return dateToInput(date);
};

const defaultTo = () => dateToInput(new Date());

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const AdminReports = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const locale = isBg ? "bg-BG" : "en-GB";

  const currency = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }),
    [locale]
  );
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [tab, setTab] = useState<Tab>("inventory");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return 20;
    const saved = Number(window.localStorage.getItem(PAGE_STORAGE_KEY));
    return PAGE_OPTIONS.includes(saved) ? saved : 20;
  });

  const text = {
    title: isBg ? "Справки" : "Reports",
    subtitle: isBg ? "Следене на наличности, движения по фактури и продажби." : "Track stock, invoice movements and sales.",
    export: isBg ? "Експорт CSV" : "Export CSV",
    from: isBg ? "От дата" : "From date",
    to: isBg ? "До дата" : "To date",
    lowThreshold: isBg ? "Ниска наличност до" : "Low stock threshold",
    refresh: isBg ? "Обнови" : "Refresh",
    products: isBg ? "Продукти" : "Products",
    units: isBg ? "Бройки в наличност" : "Units in stock",
    receivedPeriod: isBg ? "Добавени за периода" : "Received in period",
    soldPeriod: isBg ? "Продадени за периода" : "Sold in period",
    orders: isBg ? "Поръчки" : "Orders",
    revenue: isBg ? "Оборот" : "Revenue",
    lowStock: isBg ? "Ниска наличност" : "Low stock",
    outStock: isBg ? "Изчерпани продукти" : "Out-of-stock products",
    inventory: isBg ? "Наличности" : "Inventory",
    sales: isBg ? "Продажби" : "Sales",
    receipts: isBg ? "Зареждания / фактури" : "Stock receipts / invoices",
    productInvoiceSearch: isBg ? "Търси продукт или фактура" : "Search product or invoice",
    productSearch: isBg ? "Търси продукт" : "Search product",
    invoicePlaceholder: isBg ? "Име или № фактура..." : "Name or invoice no...",
    productPlaceholder: isBg ? "Име на продукт..." : "Product name...",
    category: isBg ? "Категория" : "Category",
    allCategories: isBg ? "Всички категории" : "All categories",
    onlyLow: isBg ? "Само ниска наличност" : "Low stock only",
    perPage: isBg ? "На страница" : "Per page",
    product: isBg ? "Продукт" : "Product",
    stock: isBg ? "Наличност" : "Stock",
    received: isBg ? "Добавено" : "Received",
    sold: isBg ? "Продадено" : "Sold",
    movement: isBg ? "Нетно движение" : "Net movement",
    unitsSold: isBg ? "Продадени бройки" : "Units sold",
    date: isBg ? "Дата" : "Date",
    invoice: isBg ? "Фактура" : "Invoice",
    noData: isBg ? "Няма данни за избраните филтри." : "No data matches the selected filters.",
    back: isBg ? "Назад" : "Back",
    next: isBg ? "Напред" : "Next",
    records: isBg ? "записа" : "records",
    loadError: isBg ? "Справката не можа да бъде заредена." : "The report could not be loaded.",
  };

  const loadReport = async () => {
    if (!from || !to) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        from,
        to,
        lowStockThreshold: String(Math.max(0, Number(lowStockThreshold) || 0)),
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reports?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || text.loadError);
      setData(payload);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, category, onlyLowStock]);

  const normalizedSearch = search.trim().toLocaleLowerCase(locale);

  const filteredInventory = useMemo(() => {
    if (!data) return [];
    return data.inventory.filter((row) => {
      const matchesSearch = !normalizedSearch || row.productName.toLocaleLowerCase(locale).includes(normalizedSearch);
      const matchesCategory = !category || row.categoryName === category;
      const matchesLowStock = !onlyLowStock || row.currentQuantity <= data.lowStockThreshold;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [data, normalizedSearch, category, onlyLowStock, locale]);

  const filteredSales = useMemo(() => {
    if (!data) return [];
    return data.sales.filter((row) => !normalizedSearch || row.productName.toLocaleLowerCase(locale).includes(normalizedSearch));
  }, [data, normalizedSearch, locale]);

  const filteredReceipts = useMemo(() => {
    if (!data) return [];
    return data.stockEntries.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.productName.toLocaleLowerCase(locale).includes(normalizedSearch) ||
        row.invoiceNumber.toLocaleLowerCase(locale).includes(normalizedSearch);
      return matchesSearch && (!category || row.categoryName === category);
    });
  }, [data, normalizedSearch, category, locale]);

  const activeRows = tab === "inventory" ? filteredInventory : tab === "sales" ? filteredSales : filteredReceipts;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = activeRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportCsv = () => {
    if (!data) return;
    let headers: string[] = [];
    let rows: unknown[][] = [];
    let filename = isBg ? "spravka.csv" : "report.csv";

    if (tab === "inventory") {
      headers = [text.product, text.category, isBg ? "Текуща наличност" : "Current stock", text.receivedPeriod, text.soldPeriod, text.movement];
      rows = filteredInventory.map((row) => [row.productName, row.categoryName, row.currentQuantity, row.receivedQuantity, row.soldQuantity, row.netMovement]);
      filename = `${isBg ? "nalichnosti" : "inventory"}-${from}-${to}.csv`;
    } else if (tab === "sales") {
      headers = [text.product, text.unitsSold, text.orders, `${text.revenue} EUR`];
      rows = filteredSales.map((row) => [row.productName, row.soldQuantity, row.orderCount, row.revenue.toFixed(2)]);
      filename = `${isBg ? "prodazhbi" : "sales"}-${from}-${to}.csv`;
    } else {
      headers = [text.date, text.invoice, text.product, text.category, isBg ? "Добавено количество" : "Received quantity"];
      rows = filteredReceipts.map((row) => [new Date(row.createdOn).toLocaleString(locale), row.invoiceNumber, row.productName, row.categoryName, row.quantity]);
      filename = `${isBg ? "zarezhdania" : "receipts"}-${from}-${to}.csv`;
    }

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const summaryCards = data
    ? [
        [text.products, number.format(data.summary.totalProducts)],
        [text.units, number.format(data.summary.totalUnitsInStock)],
        [text.receivedPeriod, number.format(data.summary.receivedUnits)],
        [text.soldPeriod, number.format(data.summary.soldUnits)],
        [text.orders, number.format(data.summary.totalOrders)],
        [text.revenue, currency.format(data.summary.revenue)],
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{text.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={!data || activeRows.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40">
          <ArrowDownTrayIcon className="h-5 w-5" />{text.export}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_auto] lg:items-end">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">{text.from}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">{text.to}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">{text.lowThreshold}<input type="number" min="0" value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2" /></label>
          <button type="button" onClick={() => void loadReport()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a]"><ArrowPathIcon className="h-5 w-5" />{text.refresh}</button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-white shadow-sm"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</div>
                <div className="mt-2 break-words text-lg font-bold text-slate-950 sm:text-xl">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900"><ExclamationTriangleIcon className="h-5 w-5" />{text.lowStock}</div>
              <div className="mt-2 text-2xl font-bold text-amber-950">{data.summary.lowStockProducts}</div>
              <div className="text-xs text-amber-800">{isBg ? `продукта с ${data.lowStockThreshold} или по-малко бройки` : `products with ${data.lowStockThreshold} or fewer units`}</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-900"><ChartBarSquareIcon className="h-5 w-5" />{text.outStock}</div>
              <div className="mt-2 text-2xl font-bold text-red-950">{data.summary.outOfStockProducts}</div>
              <div className="text-xs text-red-800">{isBg ? "продукта с наличност 0" : "products with stock 0"}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([
                  ["inventory", text.inventory],
                  ["sales", text.sales],
                  ["receipts", text.receipts],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setTab(key)} className={`min-h-10 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-3 md:grid-cols-[minmax(220px,2fr)_minmax(180px,1fr)_auto_auto] md:items-end">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {tab === "receipts" ? text.productInvoiceSearch : text.productSearch}
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "receipts" ? text.invoicePlaceholder : text.productPlaceholder} className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2" />
              </label>

              {tab !== "sales" ? (
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  {text.category}
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-400 px-3 py-2">
                    <option value="">{text.allCategories}</option>
                    {data.categories.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
              ) : <div />}

              {tab === "inventory" ? (
                <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={onlyLowStock} onChange={(event) => setOnlyLowStock(event.target.checked)} className="h-4 w-4 rounded border-slate-400" />{text.onlyLow}</label>
              ) : <div />}

              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                {text.perPage}
                <select value={pageSize} onChange={(event) => { const value = Number(event.target.value); setPageSize(value); setCurrentPage(1); window.localStorage.setItem(PAGE_STORAGE_KEY, String(value)); }} className="min-h-11 rounded-md border border-slate-400 px-3 py-2">
                  {PAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="table-scroll">
              {tab === "inventory" && (
                <table className="w-full min-w-[850px] divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{text.product}</th><th className="px-4 py-3">{text.category}</th><th className="px-4 py-3 text-right">{text.stock}</th><th className="px-4 py-3 text-right">{text.received}</th><th className="px-4 py-3 text-right">{text.sold}</th><th className="px-4 py-3 text-right">{text.movement}</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{(pagedRows as InventoryRow[]).map((row) => <tr key={row.productId} className={row.currentQuantity <= data.lowStockThreshold ? "bg-amber-50/60" : ""}><td className="px-4 py-3 text-sm font-medium text-slate-900">{row.productName}</td><td className="px-4 py-3 text-sm text-slate-500">{row.categoryName}</td><td className="px-4 py-3 text-right font-semibold">{number.format(row.currentQuantity)}</td><td className="px-4 py-3 text-right text-emerald-700">+{number.format(row.receivedQuantity)}</td><td className="px-4 py-3 text-right text-red-700">-{number.format(row.soldQuantity)}</td><td className={`px-4 py-3 text-right font-semibold ${row.netMovement >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.netMovement > 0 ? "+" : ""}{number.format(row.netMovement)}</td></tr>)}</tbody>
                </table>
              )}

              {tab === "sales" && (
                <table className="w-full min-w-[650px] divide-y divide-slate-200"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{text.product}</th><th className="px-4 py-3 text-right">{text.unitsSold}</th><th className="px-4 py-3 text-right">{text.orders}</th><th className="px-4 py-3 text-right">{text.revenue}</th></tr></thead><tbody className="divide-y divide-slate-100">{(pagedRows as SalesRow[]).map((row) => <tr key={row.productId}><td className="px-4 py-3 text-sm font-medium text-slate-900">{row.productName}</td><td className="px-4 py-3 text-right">{number.format(row.soldQuantity)}</td><td className="px-4 py-3 text-right">{number.format(row.orderCount)}</td><td className="px-4 py-3 text-right font-semibold">{currency.format(row.revenue)}</td></tr>)}</tbody></table>
              )}

              {tab === "receipts" && (
                <table className="w-full min-w-[800px] divide-y divide-slate-200"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">{text.date}</th><th className="px-4 py-3">{text.invoice}</th><th className="px-4 py-3">{text.product}</th><th className="px-4 py-3">{text.category}</th><th className="px-4 py-3 text-right">{text.received}</th></tr></thead><tbody className="divide-y divide-slate-100">{(pagedRows as StockEntryRow[]).map((row) => <tr key={row.id}><td className="px-4 py-3 text-sm text-slate-600">{new Date(row.createdOn).toLocaleString(locale)}</td><td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.invoiceNumber}</td><td className="px-4 py-3 text-sm text-slate-900">{row.productName}</td><td className="px-4 py-3 text-sm text-slate-500">{row.categoryName}</td><td className="px-4 py-3 text-right font-semibold text-emerald-700">+{number.format(row.quantity)}</td></tr>)}</tbody></table>
              )}

              {activeRows.length === 0 && <div className="px-4 py-12 text-center text-sm text-slate-500">{text.noData}</div>}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">{number.format(activeRows.length)} {text.records}</div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1} className="min-h-10 rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">{text.back}</button>
                <span className="text-sm text-slate-600">{isBg ? `Страница ${safePage} от ${totalPages}` : `Page ${safePage} of ${totalPages}`}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className="min-h-10 rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">{text.next}</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminReports;
