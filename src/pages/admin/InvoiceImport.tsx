import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type ProductCandidate = { id: string; name: string; confidence: number };
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
  detectedLanguage: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  duplicateInvoice: boolean;
  items: ExtractedItem[];
  textPreview: string;
};
type EditableItem = ExtractedItem & { selectedProductId: string; editableQuantity: string };

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const InvoiceImport = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [rows, setRows] = useState<EditableItem[]>([]);
  const [confirmedNames, setConfirmedNames] = useState<Set<number>>(new Set());
  const [confirmedQuantities, setConfirmedQuantities] = useState<Set<number>>(new Set());

  const text = {
    title: isBg ? "Импорт от фактура" : "Invoice import",
    choose: isBg ? "Избери файл" : "Choose file",
    analyze: isBg ? "Разчети фактурата" : "Read invoice",
    analyzing: isBg ? "Разчитане..." : "Reading...",
    invoiceNo: isBg ? "Фактура №" : "Invoice no.",
    date: isBg ? "Дата" : "Date",
    name: isBg ? "Име" : "Name",
    quantity: isBg ? "Количество" : "Quantity",
    confirmName: isBg ? "Потвърди име" : "Confirm name",
    confirmQty: isBg ? "Потвърди количество" : "Confirm quantity",
    unmatched: isBg ? "Неразпознат продукт" : "Unmatched product",
    import: isBg ? "Добави в наличности" : "Add to stock",
    importing: isBg ? "Добавяне..." : "Importing...",
    close: isBg ? "Затвори" : "Close",
    review: isBg ? "Проверка" : "Verification",
  };

  useEffect(() => () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
  }, []);

  useEffect(() => {
    if (!reviewOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [reviewOpen]);

  const validRowsWithIndexes = useMemo(() => rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const qty = Number(row.editableQuantity);
      return Boolean(row.selectedProductId) && Number.isInteger(qty) && qty > 0;
    }), [rows]);

  const validRows = useMemo(() => validRowsWithIndexes.map(({ row }) => row), [validRowsWithIndexes]);

  const allConfirmed = useMemo(() => validRowsWithIndexes.length > 0 && validRowsWithIndexes.every(({ index }) =>
    confirmedNames.has(index) && confirmedQuantities.has(index)
  ), [validRowsWithIndexes, confirmedNames, confirmedQuantities]);

  const isPdf = Boolean(file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));

  const clearConfirmation = (index: number, type: "name" | "qty") => {
    if (type === "name") {
      setConfirmedNames((current) => { const next = new Set(current); next.delete(index); return next; });
    } else {
      setConfirmedQuantities((current) => { const next = new Set(current); next.delete(index); return next; });
    }
  };

  const toggleConfirmation = (index: number, type: "name" | "qty") => {
    const setter = type === "name" ? setConfirmedNames : setConfirmedQuantities;
    setter((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectFile = (candidate: File | null) => {
    setError("");
    setResult(null);
    setRows([]);
    setConfirmedNames(new Set());
    setConfirmedQuantities(new Set());
    setInvoiceNumber("");
    setReviewOpen(false);
    setProgress(0);

    if (!candidate) { setFile(null); return; }
    const name = candidate.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setError(isBg ? "Поддържат се PDF, PNG, JPG, JPEG и WEBP." : "Supported formats: PDF, PNG, JPG, JPEG, WEBP.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError(isBg ? "Файлът е над 15 MB." : "File exceeds 15 MB.");
      return;
    }
    setFile(candidate);
  };

  const extractInvoice = async () => {
    if (!file) return;
    try {
      setExtracting(true);
      setError("");
      setProgress(2);
      progressTimerRef.current = window.setInterval(() => {
        setProgress((current) => current >= 92 ? current : Math.min(92, current + Math.max(1, Math.round((92 - current) / 8))));
      }, 600);

      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/extract`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || (isBg ? "Фактурата не можа да бъде разчетена." : "Invoice could not be read."));

      const data = payload as ExtractResponse;
      setResult(data);
      setInvoiceNumber(data.invoiceNumber ?? "");
      setRows((data.items ?? []).map((item) => ({
        ...item,
        selectedProductId: item.matchedProductId ?? "",
        editableQuantity: String(item.quantity || ""),
      })));
      setConfirmedNames(new Set());
      setConfirmedQuantities(new Set());
      setProgress(100);
      setReviewOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isBg ? "Грешка при разчитане." : "Reading error."));
    } finally {
      if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      setExtracting(false);
    }
  };

  const commitImport = async () => {
    if (!result || !allConfirmed) return;
    const cleanInvoiceNumber = invoiceNumber.trim();
    if (!cleanInvoiceNumber) {
      setError(isBg ? "Въведи номер на фактурата." : "Enter invoice number.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          invoiceNumber: cleanInvoiceNumber,
          items: validRows.map((row) => ({ productId: row.selectedProductId, quantity: Number(row.editableQuantity) })),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || (isBg ? "Неуспешен импорт." : "Import failed."));
      toast.success(isBg ? "Фактурата е добавена в наличностите." : "Invoice added to stock.");
      setResult((current) => current ? { ...current, duplicateInvoice: true } : current);
      setReviewOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isBg ? "Неуспешен импорт." : "Import failed."));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">OCR · BG / EN</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{text.title}</h1>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { selectFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          {isPdf ? <DocumentTextIcon className="h-8 w-8" /> : file ? <PhotoIcon className="h-8 w-8" /> : <CloudArrowUpIcon className="h-8 w-8" />}
        </div>
        <div className="mt-4 text-lg font-black text-slate-950">{file?.name || (isBg ? "Избери фактура" : "Choose invoice")}</div>
        {file && <div className="mt-1 text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>}
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold">{text.choose}</button>
          <button type="button" disabled={!file || extracting} onClick={() => void extractInvoice()} className="rounded-lg bg-[#18b99f] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{extracting ? text.analyzing : text.analyze}</button>
        </div>
        {(extracting || progress > 0) && (
          <div className="mx-auto mt-5 max-w-3xl text-left">
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{text.analyzing}</span><span>{progress}%</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-[#18b99f] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><ExclamationTriangleIcon className="mr-2 inline h-5 w-5" />{error}</div>}

      {result && reviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 p-1 backdrop-blur-sm sm:p-2">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-center gap-6">
                <h2 className="text-2xl font-black text-slate-950">{text.review}</h2>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">{text.invoiceNo}<input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-black text-slate-950" /></label>
                <div className="text-sm font-bold text-slate-600">{text.date}: <span className="text-base font-black text-slate-950">{result.invoiceDate || "—"}</span></div>
              </div>
              <button onClick={() => setReviewOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300"><XMarkIcon className="h-6 w-6" /></button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-black uppercase text-slate-600">
                  <tr>
                    <th className="w-[50%] px-4 py-3">{text.name}</th>
                    <th className="w-[20%] px-4 py-3 text-center">{text.confirmName}</th>
                    <th className="w-[15%] px-4 py-3 text-right">{text.quantity}</th>
                    <th className="w-[15%] px-4 py-3 text-center">{text.confirmQty}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, index) => {
                    const qty = Number(row.editableQuantity);
                    const productValid = Boolean(row.selectedProductId);
                    const qtyValid = Number.isInteger(qty) && qty > 0;
                    const nameConfirmed = confirmedNames.has(index);
                    const qtyConfirmed = confirmedQuantities.has(index);
                    return (
                      <tr key={`${row.sourceLine}-${index}`} className={nameConfirmed && qtyConfirmed ? "bg-emerald-50/50" : "bg-white"}>
                        <td className="px-4 py-4">
                          <select value={row.selectedProductId} onChange={(e) => {
                            const value = e.target.value;
                            setRows((current) => current.map((item, i) => i === index ? { ...item, selectedProductId: value } : item));
                            clearConfirmation(index, "name");
                          }} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold text-slate-950">
                            <option value="">— {text.unmatched} —</option>
                            {row.candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button type="button" disabled={!productValid} onClick={() => toggleConfirmation(index, "name")} className={`min-h-11 rounded-lg border px-4 font-black ${nameConfirmed ? "border-emerald-500 bg-emerald-500 text-white" : productValid ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}>
                            {nameConfirmed ? (isBg ? "Потвърдено" : "Confirmed") : text.confirmName}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input type="number" min="1" step="1" value={row.editableQuantity} onChange={(e) => {
                            const value = e.target.value;
                            setRows((current) => current.map((item, i) => i === index ? { ...item, editableQuantity: value } : item));
                            clearConfirmation(index, "qty");
                          }} className="min-h-12 w-28 rounded-lg border border-slate-300 px-3 text-right text-lg font-black text-slate-950" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button type="button" disabled={!qtyValid} onClick={() => toggleConfirmation(index, "qty")} className={`min-h-11 rounded-lg border px-4 font-black ${qtyConfirmed ? "border-emerald-500 bg-emerald-500 text-white" : qtyValid ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"}`}>
                            {qtyConfirmed ? (isBg ? "Потвърдено" : "Confirmed") : text.confirmQty}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-none items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-sm font-bold text-slate-600">{validRowsWithIndexes.filter(({ index }) => confirmedNames.has(index) && confirmedQuantities.has(index)).length} / {validRowsWithIndexes.length}</div>
              <div className="flex gap-2">
                <button onClick={() => setReviewOpen(false)} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold">{text.close}</button>
                <button disabled={importing || !allConfirmed || result.duplicateInvoice} onClick={() => void commitImport()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-35"><CheckCircleIcon className="h-5 w-5" />{importing ? text.importing : text.import}</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {result && !reviewOpen && <button onClick={() => setReviewOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-black text-white"><DocumentMagnifyingGlassIcon className="h-5 w-5" />{text.review}</button>}
    </div>
  );
};

export default InvoiceImport;
