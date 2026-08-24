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

const currency = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
});

const number = new Intl.NumberFormat("bg-BG");

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const AdminReports = () => {
  const { token } = useSelector((state: RootState) => state.auth);
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

  const loadReport = async () => {
    if (!from || !to) return;

    try {
      setLoading(true);
      const query = new URLSearchParams({
        from,
        to,
        lowStockThreshold: String(Math.max(0, Number(lowStockThreshold) || 0)),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Reports?${query.toString()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Справката не можа да бъде заредена.");
      }

      setData(payload);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Справката не можа да бъде заредена.");
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

  const normalizedSearch = search.trim().toLocaleLowerCase("bg-BG");

  const filteredInventory = useMemo(() => {
    if (!data) return [];
    return data.inventory.filter((row) => {
      const matchesSearch =
        !normalizedSearch || row.productName.toLocaleLowerCase("bg-BG").includes(normalizedSearch);
      const matchesCategory = !category || row.categoryName === category;
      const matchesLowStock =
        !onlyLowStock || row.currentQuantity <= data.lowStockThreshold;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [data, normalizedSearch, category, onlyLowStock]);

  const filteredSales = useMemo(() => {
    if (!data) return [];
    return data.sales.filter((row) =>
      !normalizedSearch || row.productName.toLocaleLowerCase("bg-BG").includes(normalizedSearch)
    );
  }, [data, normalizedSearch]);

  const filteredReceipts = useMemo(() => {
    if (!data) return [];
    return data.stockEntries.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        row.productName.toLocaleLowerCase("bg-BG").includes(normalizedSearch) ||
        row.invoiceNumber.toLocaleLowerCase("bg-BG").includes(normalizedSearch);
      const matchesCategory = !category || row.categoryName === category;
      return matchesSearch && matchesCategory;
    });
  }, [data, normalizedSearch, category]);

  const activeRows =
    tab === "inventory"
      ? filteredInventory
      : tab === "sales"
        ? filteredSales
        : filteredReceipts;

  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = activeRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportCsv = () => {
    if (!data) return;

    let headers: string[] = [];
    let rows: unknown[][] = [];
    let filename = "spravka.csv";

    if (tab === "inventory") {
      headers = [
        "Продукт",
        "Категория",
        "Текуща наличност",
        "Добавено за периода",
        "Продадено за периода",
        "Нетно движение",
      ];
      rows = filteredInventory.map((row) => [
        row.productName,
        row.categoryName,
        row.currentQuantity,
        row.receivedQuantity,
        row.soldQuantity,
        row.netMovement,
      ]);
      filename = `nalichnosti-${from}-${to}.csv`;
    } else if (tab === "sales") {
      headers = ["Продукт", "Продадени бройки", "Поръчки", "Оборот EUR"];
      rows = filteredSales.map((row) => [
        row.productName,
        row.soldQuantity,
        row.orderCount,
        row.revenue.toFixed(2),
      ]);
      filename = `prodazhbi-${from}-${to}.csv`;
    } else {
      headers = ["Дата", "Фактура", "Продукт", "Категория", "Добавено количество"];
      rows = filteredReceipts.map((row) => [
        new Date(row.createdOn).toLocaleString("bg-BG"),
        row.invoiceNumber,
        row.productName,
        row.categoryName,
        row.quantity,
      ]);
      filename = `zarezhdania-${from}-${to}.csv`;
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
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
        ["Продукти", number.format(data.summary.totalProducts)],
        ["Бройки в наличност", number.format(data.summary.totalUnitsInStock)],
        ["Добавени за периода", number.format(data.summary.receivedUnits)],
        ["Продадени за периода", number.format(data.summary.soldUnits)],
        ["Поръчки", number.format(data.summary.totalOrders)],
        ["Оборот", currency.format(data.summary.revenue)],
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Справки</h1>
          <p className="mt-1 text-sm text-slate-500">
            Следене на наличности, движения по фактури и продажби.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || activeRows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Експорт CSV
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">От дата</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-full rounded-md border border-slate-400 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">До дата</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-full rounded-md border border-slate-400 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Ниска наличност до</label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(event) => setLowStockThreshold(event.target.value)}
              className="w-full rounded-md border border-slate-400 px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadReport()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a]"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Обнови
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl bg-white shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-bold text-slate-950">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Ниска наличност
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-950">{data.summary.lowStockProducts}</div>
              <div className="text-xs text-amber-800">продукта с {data.lowStockThreshold} или по-малко бройки</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-900">
                <ChartBarSquareIcon className="h-5 w-5" />
                Изчерпани продукти
              </div>
              <div className="mt-2 text-2xl font-bold text-red-950">{data.summary.outOfStockProducts}</div>
              <div className="text-xs text-red-800">продукта с наличност 0</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-3">
              <div className="flex flex-wrap gap-2">
                {([
                  ["inventory", "Наличности"],
                  ["sales", "Продажби"],
                  ["receipts", "Зареждания / фактури"],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      tab === key ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-3 md:grid-cols-[minmax(220px,2fr)_minmax(180px,1fr)_auto_auto] md:items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  {tab === "receipts" ? "Търси продукт или фактура" : "Търси продукт"}
                </label>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tab === "receipts" ? "Име или № фактура..." : "Име на продукт..."}
                  className="w-full rounded-md border border-slate-400 px-3 py-2"
                />
              </div>

              {tab !== "sales" ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Категория</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-md border border-slate-400 px-3 py-2"
                  >
                    <option value="">Всички категории</option>
                    {data.categories.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              ) : <div />}

              {tab === "inventory" ? (
                <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyLowStock}
                    onChange={(event) => setOnlyLowStock(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  Само ниска наличност
                </label>
              ) : <div />}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">На страница</label>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setPageSize(value);
                    setCurrentPage(1);
                    window.localStorage.setItem(PAGE_STORAGE_KEY, String(value));
                  }}
                  className="rounded-md border border-slate-400 px-3 py-2"
                >
                  {PAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {tab === "inventory" && (
                <table className="w-full min-w-[850px] divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Продукт</th>
                      <th className="px-4 py-3">Категория</th>
                      <th className="px-4 py-3 text-right">Наличност</th>
                      <th className="px-4 py-3 text-right">Добавено</th>
                      <th className="px-4 py-3 text-right">Продадено</th>
                      <th className="px-4 py-3 text-right">Нетно движение</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(pagedRows as InventoryRow[]).map((row) => (
                      <tr key={row.productId} className={row.currentQuantity <= data.lowStockThreshold ? "bg-amber-50/60" : ""}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.productName}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{row.categoryName}</td>
                        <td className="px-4 py-3 text-right font-semibold">{number.format(row.currentQuantity)}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">+{number.format(row.receivedQuantity)}</td>
                        <td className="px-4 py-3 text-right text-red-700">-{number.format(row.soldQuantity)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${row.netMovement >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {row.netMovement > 0 ? "+" : ""}{number.format(row.netMovement)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === "sales" && (
                <table className="w-full min-w-[650px] divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Продукт</th>
                      <th className="px-4 py-3 text-right">Продадени бройки</th>
                      <th className="px-4 py-3 text-right">Поръчки</th>
                      <th className="px-4 py-3 text-right">Оборот</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(pagedRows as SalesRow[]).map((row) => (
                      <tr key={row.productId}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.productName}</td>
                        <td className="px-4 py-3 text-right">{number.format(row.soldQuantity)}</td>
                        <td className="px-4 py-3 text-right">{number.format(row.orderCount)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{currency.format(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === "receipts" && (
                <table className="w-full min-w-[800px] divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Дата</th>
                      <th className="px-4 py-3">Фактура</th>
                      <th className="px-4 py-3">Продукт</th>
                      <th className="px-4 py-3">Категория</th>
                      <th className="px-4 py-3 text-right">Добавено</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(pagedRows as StockEntryRow[]).map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3 text-sm text-slate-600">{new Date(row.createdOn).toLocaleString("bg-BG")}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{row.productName}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{row.categoryName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">+{number.format(row.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeRows.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-slate-500">Няма данни за избраните филтри.</div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">{number.format(activeRows.length)} записа</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Назад
                </button>
                <span className="text-sm text-slate-600">Страница {safePage} от {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Напред
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminReports;
