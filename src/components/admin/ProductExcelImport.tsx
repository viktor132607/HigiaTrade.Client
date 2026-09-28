import React, { useRef, useState } from "react";
import { ArrowUpTrayIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type ImportRowResult = {
  rowNumber: number;
  title: string;
  status: "created" | "updated" | "skipped" | "error";
  message: string;
  productId?: string | null;
};

type ImportResult = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  rows: ImportRowResult[];
};

type Props = {
  onImported?: () => void;
};

const ProductExcelImport = ({ onImported }: Props) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const runImport = async () => {
    if (!file || importing) return;

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/product-import/excel?updateExisting=${updateExisting}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.title ||
            `Импортът не успя (HTTP ${response.status}).`
        );
      }

      const nextResult = payload as ImportResult;
      setResult(nextResult);

      if ((nextResult.created ?? 0) + (nextResult.updated ?? 0) > 0) {
        onImported?.();
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Excel файлът не можа да бъде импортиран."
      );
    } finally {
      setImporting(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <DocumentArrowUpIcon className="h-6 w-6 text-[#18b99f]" />
            <h2 className="text-lg font-bold text-slate-950">
              Импорт на продукти от Excel
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Поддържа .xlsx. Задължителни колони: Title, Category, RegularPrice.
            Поддържат се и български заглавия: Име, Категория, Цена.
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Допълнителни колони: Description, Brand, DiscountPercentage,
            DiscountedPrice, WholesalePrice, WholesaleMinQuantity, VatRate,
            Quantity, MainImageUrl, IsActive.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(event) => setUpdateExisting(event.target.checked)}
            className="h-5 w-5 accent-[#18b99f]"
          />
          Обновявай съществуващ продукт със същите име и марка
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setResult(null);
            setError("");
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={importing}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowUpTrayIcon className="mr-2 h-5 w-5" />
          Избери Excel файл
        </button>

        <div className="min-w-0 flex-1 truncate text-sm text-slate-600">
          {file ? file.name : "Няма избран файл"}
        </div>

        {file && (
          <button
            type="button"
            onClick={clearSelection}
            disabled={importing}
            className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Изчисти
          </button>
        )}

        <button
          type="button"
          onClick={() => void runImport()}
          disabled={!file || importing}
          className="min-h-11 rounded-md bg-[#18b99f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {importing ? "Импортиране..." : "Импортирай"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Summary label="Редове" value={result.totalRows} />
            <Summary label="Създадени" value={result.created} />
            <Summary label="Обновени" value={result.updated} />
            <Summary label="Пропуснати" value={result.skipped} />
            <Summary label="Грешки" value={result.failed} />
          </div>

          {result.rows.length > 0 && (
            <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ред</th>
                    <th className="px-3 py-2">Продукт</th>
                    <th className="px-3 py-2">Статус</th>
                    <th className="px-3 py-2">Резултат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {result.rows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.title}-${row.status}`}>
                      <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {row.title || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={statusClass(row.status)}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const Summary = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
  </div>
);

const statusLabel = (status: ImportRowResult["status"]) => {
  switch (status) {
    case "created":
      return "Създаден";
    case "updated":
      return "Обновен";
    case "skipped":
      return "Пропуснат";
    default:
      return "Грешка";
  }
};

const statusClass = (status: ImportRowResult["status"]) => {
  const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";

  switch (status) {
    case "created":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "updated":
      return `${base} bg-sky-100 text-sky-800`;
    case "skipped":
      return `${base} bg-amber-100 text-amber-800`;
    default:
      return `${base} bg-red-100 text-red-800`;
  }
};

export default ProductExcelImport;
