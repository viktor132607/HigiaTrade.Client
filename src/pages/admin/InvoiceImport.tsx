import { useEffect, useMemo, useRef, useState } from "react";
import {
  CameraIcon,
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

type LiveRow = {
  rawName: string;
  matchedName: string;
  quantity: string;
};

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

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

const normalizeCameraFile = (candidate: File) => {
  const type = candidate.type.toLowerCase();
  const extension = type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : ".jpg";

  return new File([candidate], `camera-invoice-${Date.now()}${extension}`, {
    type: candidate.type || "image/jpeg",
    lastModified: candidate.lastModified || Date.now(),
  });
};

const InvoiceImport = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [rows, setRows] = useState<EditableItem[]>([]);
  const [liveRows, setLiveRows] = useState<LiveRow[]>([]);

  const text = {
    title: isBg ? "Импорт от фактура" : "Invoice import",
    subtitle: isBg
      ? "Качи PDF/снимка или заснеми фактурата директно с камерата на телефона. След разчитането се отваря екран за визуална проверка на оригинала срещу извлечените артикули и количества."
      : "Upload a PDF/image or capture the invoice directly with your phone camera. After OCR, a visual review screen opens so you can compare the original against extracted products and quantities.",
    dropTitle: isBg ? "Пусни фактурата тук" : "Drop the invoice here",
    dropText: isBg
      ? "PDF, PNG, JPG, JPEG или WEBP до 15 MB. Може Ctrl+V или директно снимане от телефон."
      : "PDF, PNG, JPG, JPEG or WEBP up to 15 MB. You can paste with Ctrl+V or capture directly on mobile.",
    choose: isBg ? "Избери файл" : "Choose file",
    camera: isBg ? "Снимай с камера" : "Open camera",
    cameraHint: isBg ? "Използва задната камера на телефона" : "Uses the phone rear camera",
    analyze: isBg ? "Разчети фактурата" : "Read invoice",
    analyzing: isBg ? "Разчитане..." : "Reading...",
    invoiceNo: isBg ? "Фактура №" : "Invoice no.",
    date: isBg ? "Дата" : "Date",
    language: isBg ? "Разпознат език" : "Detected language",
    items: isBg ? "Извлечени артикули" : "Extracted items",
    invoiceName: isBg ? "Ред от фактурата" : "Invoice row",
    matched: isBg ? "Въведен артикул в HygiaTrade" : "HygiaTrade product",
    quantity: isBg ? "Брой" : "Qty",
    unmatched: isBg ? "Неразпознат продукт" : "Unmatched product",
    noItems: isBg
      ? "Не бяха открити надеждни продуктови редове. Провери самата фактура и извлечения текст."
      : "No reliable product rows were found. Check the invoice itself and the extracted text.",
    duplicate: isBg
      ? "Този номер на фактура вече съществува в историята на наличностите. Повторен импорт ще бъде блокиран."
      : "This invoice number already exists in stock history. Duplicate import will be blocked.",
    import: isBg ? "Потвърди и добави в наличност" : "Confirm and add to stock",
    importing: isBg ? "Добавяне..." : "Importing...",
    rawText: isBg ? "Извлечен OCR текст" : "Extracted OCR text",
    reviewTitle: isBg ? "Проверка на разчитането" : "OCR verification",
    reviewSubtitle: isBg
      ? "Сравни оригиналната фактура вляво с разчетените артикули вдясно. Коригирай грешен продукт или количество преди запис."
      : "Compare the original invoice on the left with the extracted rows on the right. Correct a product match or quantity before saving.",
    original: isBg ? "Оригинална фактура" : "Original invoice",
    extracted: isBg ? "Разчетени данни" : "Extracted data",
    reopen: isBg ? "Отвори проверката" : "Open verification",
    close: isBg ? "Затвори" : "Close",
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!reviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewOpen]);

  const validImportRows = useMemo(
    () =>
      rows.filter((row) => {
        const quantity = Number(row.editableQuantity);
        return Boolean(row.selectedProductId) && Number.isInteger(quantity) && quantity > 0;
      }),
    [rows]
  );

  const isPdf = Boolean(file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));

  const validateFile = (candidate: File) => {
    const lowerName = candidate.name.toLowerCase();
    const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    const hasAcceptedImageType = ACCEPTED_IMAGE_TYPES.has(candidate.type.toLowerCase());
    const isPdfType = candidate.type === "application/pdf";

    if (!hasAcceptedExtension && !hasAcceptedImageType && !isPdfType) {
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
    setLiveRows([]);
    setInvoiceNumber("");
    setReviewOpen(false);

    if (!candidate || !validateFile(candidate)) {
      setFile(null);
      return;
    }

    setFile(candidate);
  };

  const handleCameraCapture = (candidate: File | null) => {
    if (!candidate) return;

    if (!ACCEPTED_IMAGE_TYPES.has(candidate.type.toLowerCase())) {
      setError(
        isBg
          ? "Камерата върна неподдържан формат. Използвай JPG, PNG или WEBP."
          : "The camera returned an unsupported format. Use JPG, PNG or WEBP."
      );
      return;
    }

    selectFile(normalizeCameraFile(candidate));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFile = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (!pastedFile) return;

    event.preventDefault();
    const normalized = ACCEPTED_IMAGE_TYPES.has(pastedFile.type.toLowerCase())
      ? normalizeCameraFile(pastedFile)
      : pastedFile;
    selectFile(normalized);
  };

  const extractInvoice = async () => {
    if (!file) return;

    try {
      setExtracting(true);
      setRevealing(false);
      setError("");
      setResult(null);
      setRows([]);
      setLiveRows([]);
      setReviewOpen(false);

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
      const editableRows = (data.items ?? []).map((item) => ({
        ...item,
        selectedProductId: item.matchedProductId ?? "",
        editableQuantity: String(item.quantity || ""),
      }));

      setExtracting(false);
      setRevealing(true);
      setResult(data);
      setInvoiceNumber(data.invoiceNumber ?? "");

      for (const row of editableRows) {
        const rowIndex = await new Promise<number>((resolve) => {
          setLiveRows((current) => {
            resolve(current.length);
            return [...current, { rawName: "", matchedName: "", quantity: "" }];
          });
        });

        await sleep(90);
        setLiveRows((current) => current.map((item, index) => index === rowIndex ? { ...item, rawName: row.rawName } : item));
        await sleep(90);
        setLiveRows((current) => current.map((item, index) => index === rowIndex ? { ...item, matchedName: row.matchedProductName || text.unmatched } : item));
        await sleep(90);
        setLiveRows((current) => current.map((item, index) => index === rowIndex ? { ...item, quantity: row.editableQuantity } : item));
        setRows((current) => [...current, row]);
      }

      setRevealing(false);
      setReviewOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : isBg ? "Фактурата не можа да бъде разчетена." : "The invoice could not be read.");
    } finally {
      setExtracting(false);
      setRevealing(false);
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
      setReviewOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : isBg ? "Наличностите не можаха да бъдат обновени." : "Stock could not be updated.");
    } finally {
      setImporting(false);
    }
  };

  const updateSelectedProduct = (index: number, selectedProductId: string) => {
    setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, selectedProductId } : item));
  };

  const updateQuantity = (index: number, editableQuantity: string) => {
    setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, editableQuantity } : item));
  };

  const renderReviewRows = () => {
    if (rows.length === 0) {
      return <div className="px-5 py-12 text-center text-sm text-slate-500">{text.noItems}</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-[42%] px-4 py-3">{text.invoiceName}</th>
              <th className="w-[42%] px-4 py-3">{text.matched}</th>
              <th className="w-[16%] px-4 py-3 text-right">{text.quantity}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row, index) => (
              <tr key={`${row.sourceLine}-${index}`} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-semibold leading-5 text-slate-950">{row.rawName}</div>
                  <div className="mt-2 rounded-md bg-slate-50 p-2 font-mono text-[11px] leading-4 text-slate-500">{row.sourceLine}</div>
                </td>
                <td className="px-4 py-4">
                  <select value={row.selectedProductId} onChange={(event) => updateSelectedProduct(index, event.target.value)} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#18b99f]">
                    <option value="">— {text.unmatched} —</option>
                    {row.candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} ({Math.round(candidate.confidence * 100)}%)</option>)}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceClass(row.matchConfidence)}`}>{isBg ? "артикул" : "product"}: {confidenceLabel(row.matchConfidence, isBg)} {Math.round(row.matchConfidence * 100)}%</span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${confidenceClass(row.quantityConfidence)}`}>{isBg ? "брой" : "qty"}: {confidenceLabel(row.quantityConfidence, isBg)} {Math.round(row.quantityConfidence * 100)}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <input type="number" min="0" step="1" inputMode="numeric" value={row.editableQuantity} onChange={(event) => updateQuantity(index, event.target.value)} className="min-h-11 w-24 rounded-md border border-slate-300 px-3 text-right text-base font-bold text-slate-950 outline-none focus:border-[#18b99f]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">OCR · BG / EN</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{text.title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{text.subtitle}</p>
      </div>

      <div tabIndex={0} onPaste={handlePaste} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }} onDrop={(event) => { event.preventDefault(); setDragActive(false); selectFile(event.dataTransfer.files?.[0] ?? null); }} className={`rounded-2xl border-2 border-dashed bg-white p-5 outline-none transition sm:p-8 ${dragActive ? "border-[#18b99f] bg-[#18b99f]/5" : "border-slate-300 focus:border-[#18b99f]"}`}>
        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0] ?? null); event.target.value = ""; }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { handleCameraCapture(event.target.files?.[0] ?? null); event.target.value = ""; }} />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">{isPdf ? <DocumentTextIcon className="h-8 w-8" /> : file ? <PhotoIcon className="h-8 w-8" /> : <CloudArrowUpIcon className="h-8 w-8" />}</div>
          <h2 className="mt-4 break-all text-lg font-bold text-slate-950">{file ? file.name : text.dropTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : text.dropText}</p>

          <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-[#18b99f] hover:text-[#148f7c]">{text.choose}</button>
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#18b99f] bg-[#18b99f]/10 px-5 py-2 text-sm font-semibold text-[#148f7c] hover:bg-[#18b99f] hover:text-white sm:hidden" title={text.cameraHint}><CameraIcon className="h-5 w-5" />{text.camera}</button>
            <button type="button" disabled={!file || extracting || revealing} onClick={() => void extractInvoice()} className="min-h-11 rounded-lg bg-[#18b99f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-40">{extracting || revealing ? text.analyzing : text.analyze}</button>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:hidden">{text.cameraHint}</p>
        </div>
      </div>

      {(extracting || revealing || liveRows.length > 0) && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-black text-slate-950">{isBg ? "Разчитане в реално време" : "Live OCR reading"}</div>
              <div className="mt-0.5 text-xs text-slate-500">{extracting ? (isBg ? "OCR обработва фактурата..." : "OCR is processing the invoice...") : revealing ? (isBg ? "Попълване на разпознатите клетки..." : "Filling recognized cells...") : (isBg ? "Разчитането приключи." : "Reading complete.")}</div>
            </div>
            <div className="text-sm font-black text-[#18b99f]">{liveRows.filter((row) => row.quantity).length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[42%] px-4 py-3">{text.invoiceName}</th>
                  <th className="w-[42%] px-4 py-3">{text.matched}</th>
                  <th className="w-[16%] px-4 py-3 text-right">{text.quantity}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {liveRows.map((row, index) => (
                  <tr key={index} className="h-14">
                    <td className="px-4 py-3 font-semibold text-slate-950">{row.rawName || <span className="animate-pulse text-slate-300">•••</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{row.matchedName || <span className="animate-pulse text-slate-300">•••</span>}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-950">{row.quantity || <span className="animate-pulse text-slate-300">•••</span>}</td>
                  </tr>
                ))}
                {extracting && liveRows.length === 0 && (
                  <tr className="h-16"><td className="px-4 py-4 text-slate-400" colSpan={3}><span className="animate-pulse">{isBg ? "Търся първия продуктов ред..." : "Looking for the first product row..."}</span></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {error && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" /><span>{error}</span></div>}

      {result && !revealing && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950"><DocumentMagnifyingGlassIcon className="h-5 w-5 text-[#18b99f]" />{text.reviewTitle}</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{rows.length} {isBg ? "реда са разчетени. Отвори проверката, за да сравниш всичко с оригинала." : "rows were extracted. Open verification to compare everything with the original."}</p>
            </div>
            <button type="button" onClick={() => setReviewOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-[#18b99f]"><DocumentMagnifyingGlassIcon className="h-5 w-5" />{text.reopen}</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="text-[11px] font-semibold uppercase text-slate-500">{text.invoiceNo}</div><div className="mt-1 truncate font-bold text-slate-950">{invoiceNumber || "—"}</div></div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="text-[11px] font-semibold uppercase text-slate-500">{text.date}</div><div className="mt-1 font-bold text-slate-950">{result.invoiceDate || "—"}</div></div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="text-[11px] font-semibold uppercase text-slate-500">{text.language}</div><div className="mt-1 font-bold text-slate-950">{result.detectedLanguage === "bg" ? "Български" : "English"}</div></div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm"><div className="text-[11px] font-semibold uppercase text-slate-500">{text.items}</div><div className="mt-1 font-bold text-slate-950">{rows.length}</div></div>
          </div>
        </section>
      )}

      {result && !revealing && <details className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"><summary className="cursor-pointer text-sm font-bold text-slate-800">{text.rawText}</summary><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-200">{result.textPreview}</pre></details>}

      {result && reviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/75 p-0 backdrop-blur-sm sm:p-3 lg:p-5">
          <div className="mx-auto flex h-full max-w-[1900px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl">
            <header className="flex flex-none items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0"><h2 className="text-lg font-black text-slate-950 sm:text-xl">{text.reviewTitle}</h2><p className="mt-1 max-w-5xl text-xs leading-5 text-slate-500 sm:text-sm">{text.reviewSubtitle}</p></div>
              <button type="button" onClick={() => setReviewOpen(false)} className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950" aria-label={text.close} title={text.close}><XMarkIcon className="h-5 w-5" /></button>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)]">
              <section className="flex min-h-[46vh] min-w-0 flex-col border-b border-slate-200 bg-slate-100 lg:min-h-0 lg:border-b-0 lg:border-r">
                <div className="flex flex-none items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5"><div className="text-xs font-black uppercase tracking-wide text-slate-700">{text.original}</div><div className="max-w-[60%] truncate text-xs text-slate-500" title={file?.name}>{file?.name}</div></div>
                <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
                  {previewUrl ? (isPdf ? <iframe src={previewUrl} title={text.original} className="h-full min-h-[600px] w-full border-0 bg-white shadow-sm" /> : <div className="flex min-h-full items-start justify-center"><img src={previewUrl} alt={text.original} className="max-h-none max-w-full bg-white object-contain shadow-sm" /></div>) : <div className="flex h-full items-center justify-center text-sm text-slate-500">{isBg ? "Няма визуализация." : "No preview available."}</div>}
                </div>
              </section>

              <section className="flex min-h-[54vh] min-w-0 flex-col bg-white lg:min-h-0">
                <div className="flex-none border-b border-slate-200 bg-white p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-wide text-slate-700">{text.extracted}</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{text.invoiceNo}</span><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="mt-1 min-h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm font-bold text-slate-950 outline-none focus:border-[#18b99f]" placeholder={isBg ? "Въведи номер" : "Enter number"} /></label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{text.date}</div><div className="mt-1 text-sm font-bold text-slate-950">{result.invoiceDate || "—"}</div></div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{text.items}</div><div className="mt-1 text-sm font-bold text-slate-950">{rows.length}</div></div>
                  </div>
                  {result.duplicateInvoice && <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><ExclamationTriangleIcon className="h-4 w-4 flex-none" /><span>{text.duplicate}</span></div>}
                  {error && <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><ExclamationTriangleIcon className="h-4 w-4 flex-none" /><span>{error}</span></div>}
                </div>
                <div className="min-h-0 flex-1 overflow-auto">{renderReviewRows()}</div>
                <footer className="flex flex-none flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs leading-5 text-slate-500">{isBg ? `${validImportRows.length} от ${rows.length} реда са готови за импорт. Провери визуално всеки ред преди потвърждение.` : `${validImportRows.length} of ${rows.length} rows are ready to import. Visually verify every row before confirming.`}</div>
                  <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => setReviewOpen(false)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{text.close}</button><button type="button" disabled={importing || validImportRows.length === 0 || result.duplicateInvoice} onClick={() => void commitImport()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#18b99f] disabled:cursor-not-allowed disabled:opacity-40"><CheckCircleIcon className="h-5 w-5" />{importing ? text.importing : text.import}</button></div>
                </footer>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceImport;
