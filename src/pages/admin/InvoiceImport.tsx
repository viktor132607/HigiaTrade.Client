import { useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type ProductCandidate = {
  id: string;
  name: string;
  confidence: number;
};

type ExtractedItem = {
  rawName: string;
  quantity: number;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchConfidence: number;
  quantityConfidence: number;
  candidates: ProductCandidate[];
  sourceLine: string;
};

type ExtractResponse = {
  fileName: string;
  detectedLanguage: "bg" | "en" | string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  duplicateInvoice: boolean;
  items: ExtractedItem[];
  textPreview: string;
};

type EditableItem = ExtractedItem & {
  selectedProductId: string;
  editableQuantity: string;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const confidenceLabel = (value: number, isBg: boolean) => {
  if (value >= 0.85) return isBg ? "висока" : "high";
  if (value >= 0.62) return isBg ? "средна" : "medium";
  return isBg ? "ниска" : "low";
};

const confidenceClass = (value: number) => {
  if (value >= 0.85) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value >= 0.62) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
};

const InvoiceImport = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [rows, setRows] = useState<EditableItem[]>([]);

  const text = {
    title: isBg ? "Импорт от фактура" : "Invoice import",
    subtitle: isBg
      ? "Качи българска или английска фактура като PDF или снимка. Системата извлича продуктите и закупените количества, след което ти потвърждаваш преди промяна на наличностите."
      : "Upload a Bulgarian or English invoice as PDF or image. The system extracts purchased products and quantities, then waits for your confirmation before changing stock.",
    dropTitle: isBg ? "Пусни фактурата тук" : "Drop the invoice here",
    dropText: isBg
      ? "PDF, PNG, JPG, JPEG или WEBP до 15 MB. Може и Ctrl+V за снимка от clipboard."
      : "PDF, PNG, JPG, JPEG or WEBP up to 15 MB. You can also paste an image with Ctrl+V.",
    choose: isBg ? "Избери файл" : "Choose file",
    analyze: isBg ? "Разчети фактурата" : "Read invoice",
    analyzing: isBg ? "Разчитане..." : "Reading...",
    invoiceNo: isBg ? "Фактура №" : "Invoice no.",
    date: isBg ? "Дата" : "Date",
    language: isBg ? "Разпознат език" : "Detected language",
    items: isBg ? "Извлечени артикули" : "Extracted items",
    invoiceName: isBg ? "Име от фактурата" : "Invoice item name",
    matched: isBg ? "Продукт в HygiaTrade" : "HygiaTrade product",
    quantity: isBg ? "Количество" : "Quantity",
    confidence: isBg ? "Увереност" : "Confidence",
    unmatched: isBg ? "Неразпознат продукт" : "Unmatched product",
    noItems: isBg
      ? "Не бяха открити надеждни продуктови редове. Провери извлечения текст по-долу или използвай по-ясна фактура."
      : "No reliable product rows were found. Check the extracted text below or use a clearer invoice.",
    duplicate: isBg
      ? "Този номер на фактура вече съществува в историята на наличностите. Повторен импорт ще бъде блокиран."
      : "This invoice number already exists in stock history. Duplicate import will be blocked.",
    import: isBg ? "Потвърди и добави в наличност" : "Confirm and add to stock",
    importing: isBg ? "Добавяне..." : "Importing...",
    rawText: isBg ? "Извлечен текст" : "Extracted text",
    sourceLine: isBg ? "Ред от документа" : "Document line",
  };

  const validImportRows = useMemo(
    () =>
      rows.filter((row) => {
        const quantity = Number(row.editableQuantity);
        return Boolean(row.selectedProductId) && Number.isInteger(quantity) && quantity > 0;
      }),
    [rows]
  );

  const validateFile = (candidate: File) => {
    const lowerName = candidate.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      setError(isBg ? "Поддържат се PDF, PNG, JPG, JPEG и WEBP." : "Supported formats are PDF, PNG, JPG, JPEG and WEBP.");
      return false;
    }

    if (candidate.size > MAX_FILE_SIZE) {
      setError(isBg ? "Файлът не може да е по-голям от 15 MB." : "The file cannot exceed 15 MB.");
      return false;
    }

    return true;
  };

  const selectFile = (candidate: File | null) => {
    setError("");
    setResult(null);
    setRows([]);
    setInvoiceNumber("");

    if (!candidate || !validateFile(candidate)) {
      setFile(null);
      return;
    }

    setFile(candidate);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFile = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (!pastedFile) return;

    event.preventDefault();
    const extension = pastedFile.type.includes("png") ? ".png" : ".jpg";
    selectFile(new File([pastedFile], `clipboard-invoice-${Date.now()}${extension}`, { type: pastedFile.type }));
  };

  const extractInvoice = async () => {
    if (!file) return;

    try {
      setExtracting(true);
      setError("");
      setResult(null);
      setRows([]);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/extract`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || (isBg ? "Фактурата не можа да бъде разчетена." : "The invoice could not be read."));
      }

      const data = payload as ExtractResponse;
      setResult(data);
      setInvoiceNumber(data.invoiceNumber ?? "");
      setRows(
        (data.items ?? []).map((item) => ({
          ...item,
          selectedProductId: item.matchedProductId ?? "",
          editableQuantity: String(item.quantity || ""),
        }))
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : isBg ? "Фактурата не можа да бъде разчетена." : "The invoice could not be read.");
    } finally {
      setExtracting(false);
    }
  };

  const commitImport = async () => {
    const cleanInvoiceNumber = invoiceNumber.trim();
    if (!cleanInvoiceNumber) {
      setError(isBg ? "Въведи номер на фактурата преди импорт." : "Enter the invoice number before importing.");
      return;
    }

    if (validImportRows.length === 0) {
      setError(isBg ? "Няма потвърдени продукти с валидно цяло количество." : "There are no confirmed products with a valid whole-number quantity.");
      return;
    }

    try {
      setImporting(true);
      setError("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          invoiceNumber: cleanInvoiceNumber,
          items: validImportRows.map((row) => ({
            productId: row.selectedProductId,
            quantity: Number(row.editableQuantity),
          })),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || (isBg ? "Наличностите не можаха да бъдат обновени." : "Stock could not be updated."));
      }

      toast.success(
        isBg
          ? `Импортирани ${payload.importedProducts ?? validImportRows.length} продукта / ${payload.importedUnits ?? ""} бр.`
          : `Imported ${payload.importedProducts ?? validImportRows.length} products / ${payload.importedUnits ?? ""} units.`
      );

      setResult((current) => (current ? { ...current, duplicateInvoice: true } : current));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : isBg ? "Наличностите не можаха да бъдат обновени." : "Stock could not be updated.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">OCR · BG / EN</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{text.title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{text.subtitle}</p>
      </div>

      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={`rounded-2xl border-2 border-dashed bg-white p-5 outline-none transition sm:p-8 ${
          dragActive ? "border-[#18b99f] bg-[#18b99f]/5" : "border-slate-300 focus:border-[#18b99f]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            {file?.type === "application/pdf" ? <DocumentTextIcon className="h-8 w-8" /> : file ? <PhotoIcon className="h-8 w-8" /> : <CloudArrowUpIcon className="h-8 w-8" />}
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-950">{file ? file.name : text.dropTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : text.dropText}
          </p>

          <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-[#18b99f] hover:text-[#148f7c]"
            >
              {text.choose}
            </button>
            <button
              type="button"
              disabled={!file || extracting}
              onClick={() => void extractInvoice()}
              className="min-h-11 rounded-lg bg-[#18b99f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {extracting ? text.analyzing : text.analyze}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{text.invoiceNo}</span>
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-md border border-slate-300 px-3 font-semibold text-slate-950 outline-none focus:border-[#18b99f]"
                placeholder={isBg ? "Въведи номер" : "Enter number"}
              />
            </label>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text.date}</div>
              <div className="mt-2 font-semibold text-slate-950">{result.invoiceDate || "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text.language}</div>
              <div className="mt-2 font-semibold text-slate-950">{result.detectedLanguage === "bg" ? "Български" : "English"}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text.items}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{rows.length}</div>
            </div>
          </div>

          {result.duplicateInvoice && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" />
              <span>{text.duplicate}</span>
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-bold text-slate-950">{text.items}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {isBg
                  ? "Провери съпоставянето и количеството. Нищо не влиза в наличност, докато не натиснеш потвърждение."
                  : "Review product matching and quantity. Nothing changes stock until you confirm."}
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">{text.noItems}</div>
            ) : (
              <div className="table-scroll">
                <table className="w-full min-w-[840px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">{text.invoiceName}</th>
                      <th className="px-4 py-3">{text.matched}</th>
                      <th className="px-4 py-3">{text.quantity}</th>
                      <th className="px-4 py-3">{text.confidence}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((row, index) => (
                      <tr key={`${row.sourceLine}-${index}`} className="align-top">
                        <td className="px-4 py-4">
                          <div className="max-w-md font-semibold text-slate-950">{row.rawName}</div>
                          <details className="mt-2 max-w-md text-xs text-slate-500">
                            <summary className="cursor-pointer font-medium text-slate-600">{text.sourceLine}</summary>
                            <div className="mt-1 break-words rounded bg-slate-50 p-2 font-mono">{row.sourceLine}</div>
                          </details>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={row.selectedProductId}
                            onChange={(event) =>
                              setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, selectedProductId: event.target.value } : item))
                            }
                            className="min-h-11 w-full min-w-64 rounded-md border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-[#18b99f]"
                          >
                            <option value="">— {text.unmatched} —</option>
                            {row.candidates.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.name} ({Math.round(candidate.confidence * 100)}%)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={row.editableQuantity}
                            onChange={(event) =>
                              setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, editableQuantity: event.target.value } : item))
                            }
                            className="min-h-11 w-28 rounded-md border border-slate-300 px-3 text-right font-semibold text-slate-950 outline-none focus:border-[#18b99f]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${confidenceClass(row.matchConfidence)}`}>
                              {isBg ? "продукт" : "product"}: {confidenceLabel(row.matchConfidence, isBg)} {Math.round(row.matchConfidence * 100)}%
                            </span>
                            <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${confidenceClass(row.quantityConfidence)}`}>
                              {isBg ? "количество" : "quantity"}: {confidenceLabel(row.quantityConfidence, isBg)} {Math.round(row.quantityConfidence * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-xs text-slate-500">
                {isBg
                  ? `${validImportRows.length} реда са готови за импорт. Неразпознатите остават само за преглед.`
                  : `${validImportRows.length} rows are ready to import. Unmatched rows remain for review only.`}
              </div>
              <button
                type="button"
                disabled={importing || validImportRows.length === 0}
                onClick={() => void commitImport()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#18b99f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircleIcon className="h-5 w-5" />
                {importing ? text.importing : text.import}
              </button>
            </div>
          </section>

          <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">{text.rawText}</summary>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-200">{result.textPreview}</pre>
          </details>
        </>
      )}
    </div>
  );
};

export default InvoiceImport;
