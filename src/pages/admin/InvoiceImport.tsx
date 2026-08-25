import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircleIcon, CloudArrowUpIcon, DocumentTextIcon, ExclamationTriangleIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { invoiceFileKey, loadPendingInvoiceFiles, persistPendingInvoiceFiles, removePendingInvoiceFile } from "./invoiceQueueStorage";

type ProductCandidate = { id: string; name: string; confidence: number };
type CatalogProduct = { id: string; name: string };
type CategoryOption = { id: string; name: string };
type ExtractedItem = { rawName: string; quantity: number; matchedProductId: string | null; matchedProductName: string | null; matchConfidence: number; quantityConfidence: number; candidates: ProductCandidate[]; sourceLine: string };
type ExtractResponse = { fileName: string; detectedLanguage: string; invoiceNumber: string | null; invoiceDate: string | null; duplicateInvoice: boolean; items: ExtractedItem[]; textPreview: string };
type EditableItem = ExtractedItem & { selectedProductId: string; editableProductName: string; editableQuantity: string };

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const INCOMPLETE_MARKER = "[INVOICE_IMPORT_INCOMPLETE]";

const isRealItem = (item: ExtractedItem) => {
  const text = `${item.rawName} ${item.sourceLine}`.toLowerCase().trim();
  const noise = ["дата:", "date:", "invoice date", "фактура №", "invoice no", "данъчна основа", "vat", "ддс", "общо", "total", "основание:", "payment", "iban", "банка"];
  return !noise.some((term) => text.includes(term)) && !/^(дата|date)\b/i.test(item.rawName.trim()) && item.rawName.trim().length >= 3 && Number(item.quantity) > 0;
};

const collectNamed = (value: unknown): CatalogProduct[] => {
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? o.Id ?? "");
    const name = String(o.title ?? o.Title ?? o.name ?? o.Name ?? "").trim();
    return id && name ? [{ id, name }] : [];
  });
  if (!value || typeof value !== "object") return [];
  const o = value as Record<string, unknown>;
  for (const key of ["items", "Items", "products", "Products", "categories", "Categories", "data", "Data", "result", "Result"]) {
    const found = collectNamed(o[key]);
    if (found.length) return found;
  }
  return [];
};

const InvoiceImport = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queueLoadedRef = useRef(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [rows, setRows] = useState<EditableItem[]>([]);
  const [confirmedQuantities, setConfirmedQuantities] = useState<Set<number>>(new Set());

  const file = files[activeFileIndex] ?? null;
  const isPdf = Boolean(file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const validRowsWithIndexes = useMemo(() => rows.map((row, index) => ({ row, index })).filter(({ row }) => Boolean(row.selectedProductId || row.editableProductName.trim()) && Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0), [rows]);
  const allConfirmed = rows.length > 0 && rows.every((row, index) => Boolean(row.selectedProductId || row.editableProductName.trim()) && Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0 && confirmedQuantities.has(index));
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const loadCatalog = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`, { headers: authHeaders });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return;
    const products = collectNamed(payload);
    setCatalog(Array.from(new Map(products.map((p) => [p.id, p])).values()).sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => { void loadCatalog(); }, [token]);
  useEffect(() => {
    const restoreQueue = async () => {
      try {
        const stored = await loadPendingInvoiceFiles();
        setFiles((current) => {
          const merged = new Map<string, File>();
          stored.forEach((pending) => merged.set(invoiceFileKey(pending), pending));
          current.forEach((pending) => merged.set(invoiceFileKey(pending), pending));
          return Array.from(merged.values());
        });
      } catch {
      } finally {
        queueLoadedRef.current = true;
      }
    };
    void restoreQueue();
  }, []);
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`, { headers: authHeaders });
        const payload = await response.json().catch(() => null);
        if (!response.ok) return;
        setCategories(collectNamed(payload));
      } catch { }
    };
    void loadCategories();
  }, [token]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const resetQuantityConfirmation = (index: number) => setConfirmedQuantities((current) => { const next = new Set(current); next.delete(index); return next; });
  const toggleQuantity = (index: number) => setConfirmedQuantities((current) => { const next = new Set(current); next.has(index) ? next.delete(index) : next.add(index); return next; });
  const confirmAllQuantities = () => setConfirmedQuantities(new Set(rows.map((row, index) => ({ row, index })).filter(({ row }) => Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0).map(({ index }) => index)));
  const resetReview = () => { setResult(null); setRows([]); setConfirmedQuantities(new Set()); setInvoiceNumber(""); setInvoiceDate(""); setReviewOpen(false); setProgress(0); setError(""); };

  const selectFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const incoming = Array.from(selected);
    const invalid = incoming.find((candidate) => !ACCEPTED_EXTENSIONS.some((ext) => candidate.name.toLowerCase().endsWith(ext)) || candidate.size > MAX_FILE_SIZE);
    if (invalid) { setError(isBg ? `Невалиден файл: ${invalid.name}` : `Invalid file: ${invalid.name}`); return; }
    setFiles((current) => {
      const existing = new Set(current.map(invoiceFileKey));
      const additions = incoming.filter((candidate) => !existing.has(invoiceFileKey(candidate)));
      if (additions.length) void persistPendingInvoiceFiles(additions);
      return [...current, ...additions];
    });
    if (files.length === 0) setActiveFileIndex(0);
    setError("");
  };

  const removeQueuedFile = async (index: number) => {
    const target = files[index];
    if (!target) return;
    await removePendingInvoiceFile(target).catch(() => undefined);
    setFiles((current) => current.filter((_, i) => i !== index));
    if (index === activeFileIndex) resetReview();
    setActiveFileIndex((current) => {
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, current - 1);
      return current;
    });
  };

  const extractInvoice = async () => {
    if (!file) return;
    try {
      setExtracting(true); setError(""); setProgress(10);
      const formData = new FormData(); formData.append("file", file); setProgress(20);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/extract`, { method: "POST", headers: authHeaders, body: formData });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "OCR error");
      const data = payload as ExtractResponse;
      const cleanItems = (data.items ?? []).filter(isRealItem);
      setResult({ ...data, items: cleanItems });
      setInvoiceNumber(data.invoiceNumber ?? "");
      setInvoiceDate(data.invoiceDate ?? "");
      setRows(cleanItems.map((item) => ({ ...item, selectedProductId: item.matchedProductId ?? "", editableProductName: item.matchedProductName ?? item.rawName, editableQuantity: String(item.quantity || "") })));
      setConfirmedQuantities(new Set()); setProgress(100); setReviewOpen(true);
    } catch (e) { setError(e instanceof Error ? e.message : "OCR error"); }
    finally { setExtracting(false); }
  };

  const createPlaceholderProduct = async (title: string): Promise<string> => {
    const normalized = title.trim().toLocaleLowerCase();
    const existing = catalog.find((product) => product.name.trim().toLocaleLowerCase() === normalized);
    if (existing) return existing.id;
    const categoryId = categories[0]?.id;
    if (!categoryId) throw new Error(isBg ? "Няма налична категория за автоматично добавяне на нов продукт." : "No category is available for automatic product creation.");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ title: title.trim(), brand: null, description: `${INCOMPLETE_MARKER} ${title.trim()}`, mainImageUrl: "", isActive: false, regularPrice: 0, discountPercentage: 0, discountedPrice: 0, wholesalePrice: 0, wholesaleMinQuantity: 0, vatRate: 20, quantity: 0, categoryId, secondaryImages: [] })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || (isBg ? `Неуспешно добавяне на ${title}.` : `Could not create ${title}.`));
    const fromPayload = collectNamed(payload).find((product) => product.name.trim().toLocaleLowerCase() === normalized);
    if (fromPayload?.id) return fromPayload.id;
    const reload = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`, { headers: authHeaders });
    const reloadPayload = await reload.json().catch(() => null);
    const created = collectNamed(reloadPayload).find((product) => product.name.trim().toLocaleLowerCase() === normalized);
    if (!created?.id) throw new Error(isBg ? `Продуктът ${title} беше създаден, но не може да бъде намерен.` : `${title} was created but cannot be found.`);
    return created.id;
  };

  const commitImport = async () => {
    if (!result || !allConfirmed || !invoiceNumber.trim() || !file) return;
    try {
      setImporting(true); setError("");
      const missing = rows.map((row, index) => ({ row, index })).filter(({ row }) => !row.selectedProductId && row.editableProductName.trim());
      const created = await Promise.all(missing.map(async ({ row, index }) => ({ index, id: await createPlaceholderProduct(row.editableProductName) })));
      const createdMap = new Map(created.map((item) => [item.index, item.id]));
      const items = rows.map((row, index) => ({ productId: row.selectedProductId || createdMap.get(index) || "", quantity: Number(row.editableQuantity) }));
      if (items.some((item) => !item.productId)) throw new Error(isBg ? "Има ред без валиден продукт." : "A row has no valid product.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/commit`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ invoiceNumber: invoiceNumber.trim(), invoiceDate: invoiceDate.trim(), items }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Import failed");
      if (created.length) toast.warning(isBg ? `${created.length} нови продукта са добавени като чернови и чакат допълване в Продукти.` : `${created.length} new products were added as drafts and need completion in Products.`);
      toast.success(isBg ? "Фактурата е въведена и махната от опашката." : "Invoice imported and removed from queue.");
      const removedIndex = activeFileIndex;
      const completedFile = file;
      await removePendingInvoiceFile(completedFile).catch(() => undefined);
      setFiles((current) => current.filter((_, index) => index !== removedIndex));
      setActiveFileIndex((current) => Math.max(0, current - (removedIndex > 0 ? 1 : 0)));
      await loadCatalog();
      resetReview();
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed"); }
    finally { setImporting(false); }
  };

  return <div className="space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">OCR · BG / EN</p><h1 className="mt-2 text-3xl font-black text-slate-950">{isBg ? "Импорт от фактура" : "Invoice import"}</h1></div>
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { selectFiles(e.target.files); e.target.value = ""; }} />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">{isPdf ? <DocumentTextIcon className="h-8 w-8" /> : file ? <PhotoIcon className="h-8 w-8" /> : <CloudArrowUpIcon className="h-8 w-8" />}</div>
      <div className="mt-4 text-lg font-black">{files.length ? `${files.length} ${isBg ? "фактури чакат обработка" : "invoices pending"}` : (isBg ? "Избери фактури" : "Choose invoices")}</div>
      {files.length > 0 && <div className="mx-auto mt-4 grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-3">{files.map((candidate, index) => <div key={invoiceFileKey(candidate)} className={`relative rounded-xl border ${index === activeFileIndex ? "border-[#18b99f] bg-[#18b99f]/10" : "border-slate-200 bg-slate-50"}`}><button type="button" onClick={() => { setActiveFileIndex(index); resetReview(); }} className="block w-full px-4 py-3 pr-11 text-left"><div className="truncate font-black text-slate-950">{candidate.name}</div><div className="mt-1 text-xs text-slate-500">{(candidate.size / 1024 / 1024).toFixed(2)} MB · {isBg ? "запазена · чака потвърждение" : "saved · pending"}</div></button><button type="button" aria-label={isBg ? "Премахни фактурата" : "Remove invoice"} onClick={() => void removeQueuedFile(index)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600"><XMarkIcon className="h-4 w-4" /></button></div>)}</div>}
      <div className="mt-5 flex justify-center gap-2"><button onClick={() => fileInputRef.current?.click()} className="rounded-lg border px-5 py-3 font-bold">{isBg ? "Добави още фактури" : "Add more invoices"}</button><button disabled={!file || extracting} onClick={() => void extractInvoice()} className="rounded-lg bg-[#18b99f] px-5 py-3 font-bold text-white disabled:opacity-40">{extracting ? (isBg ? "Разчитане..." : "Reading...") : (isBg ? `Разчети ${file?.name ?? "фактурата"}` : `Read ${file?.name ?? "invoice"}`)}</button></div>
      {extracting && <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /><div className="max-w-full truncate text-sm font-black text-slate-700">{isBg ? `Разчитане на ${file?.name ?? "фактурата"}...` : `Reading ${file?.name ?? "invoice"}...`}</div></div>}
    </div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700"><ExclamationTriangleIcon className="mr-2 inline h-5 w-5" />{error}</div>}
    {result && reviewOpen && <div className="fixed inset-0 z-[100] bg-slate-950/80 p-1"><div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white">
      <header className="flex items-center justify-between border-b px-5 py-3"><div className="flex flex-wrap items-center gap-6"><h2 className="text-2xl font-black">{isBg ? "Проверка" : "Verification"}</h2><label className="flex items-center gap-2 font-bold">{isBg ? "Фактура №" : "Invoice no."}<input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="rounded-lg border px-3 py-2 font-black" /></label><label className="flex items-center gap-2 font-bold">{isBg ? "Дата" : "Date"}<input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="rounded-lg border px-3 py-2 font-black" /></label></div><button onClick={() => setReviewOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border"><XMarkIcon className="h-6 w-6" /></button></header>
      <div className="grid min-h-0 flex-1 grid-cols-[40%_60%] overflow-hidden">
        <section className="min-h-0 border-r bg-slate-100"><div className="border-b bg-white px-4 py-2 text-xs font-black uppercase text-slate-600">{isBg ? "Оригинална фактура" : "Original invoice"}</div><div className="h-[calc(100%-37px)] overflow-auto p-2">{isPdf ? <iframe title="Original invoice" src={previewUrl} className="h-full min-h-[700px] w-full border-0 bg-white" /> : <img src={previewUrl} alt={file?.name || "Invoice"} className="mx-auto max-h-none w-full object-contain bg-white" />}</div></section>
        <section className="min-h-0 overflow-auto p-3"><table className="w-full min-w-[760px] text-sm"><thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-black uppercase text-slate-600"><tr><th className="w-[62%] px-3 py-3">{isBg ? `Продукт (${catalog.length} в каталога)` : `Product (${catalog.length} in catalog)`}</th><th className="w-[16%] px-3 py-3 text-right">{isBg ? "Количество" : "Quantity"}</th><th className="w-[22%] px-3 py-3 text-center"><button type="button" onClick={confirmAllQuantities} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-black text-emerald-800">{isBg ? "Потвърди всички количества" : "Confirm all quantities"}</button></th></tr></thead>
        <tbody className="divide-y">{rows.map((row, index) => { const qty = Number(row.editableQuantity); const qtyValid = Number.isInteger(qty) && qty > 0; const qc = confirmedQuantities.has(index); const missing = !row.selectedProductId; return <tr key={`${row.sourceLine}-${index}`} className={qc ? "bg-emerald-50/50" : "bg-white"}>
          <td className="px-3 py-3"><div className="mb-1 text-xs font-bold text-slate-500">{isBg ? "От фактурата:" : "From invoice:"} <span className="text-slate-950">{row.rawName}</span></div><select value={row.selectedProductId} onChange={(e) => { const id=e.target.value; const p=catalog.find((x)=>x.id===id); setRows((current)=>current.map((item,i)=>i===index?{...item,selectedProductId:id,editableProductName:p?.name ?? item.editableProductName}:item)); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold"><option value="">— {isBg ? "Няма в каталога — ще се добави автоматично" : "Not in catalog — will be added automatically"} —</option>{catalog.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input value={row.editableProductName} onChange={(e)=>{const value=e.target.value;setRows((current)=>current.map((item,i)=>i===index?{...item,editableProductName:value,selectedProductId:""}:item));}} className="mt-2 min-h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold" placeholder={isBg?"Име на продукта":"Product name"}/>{missing && <div className="mt-1 text-xs font-bold text-amber-700">{isBg ? "Ще се създаде автоматично като неактивен продукт за допълване." : "Will be auto-created as an inactive product to complete later."}</div>}</td>
          <td className="px-3 py-3 text-right"><input type="number" min="1" step="1" value={row.editableQuantity} onChange={(e)=>{const value=e.target.value;setRows((c)=>c.map((x,i)=>i===index?{...x,editableQuantity:value}:x));resetQuantityConfirmation(index);}} className="w-24 rounded-lg border px-2 py-2 text-right text-base font-black" /></td>
          <td className="px-3 py-3 text-center"><button disabled={!qtyValid} onClick={()=>toggleQuantity(index)} className={`rounded-lg border px-3 py-2 font-black ${qc?"bg-emerald-500 text-white":qtyValid?"border-emerald-300 bg-emerald-50 text-emerald-800":"bg-slate-100 text-slate-400"}`}>{qc?(isBg?"Потвърдено":"Confirmed"):(isBg?"Потвърди количество":"Confirm quantity")}</button></td>
        </tr>; })}</tbody></table></section>
      </div>
      <footer className="flex items-center justify-between border-t bg-slate-50 px-5 py-4"><div className="font-bold">{validRowsWithIndexes.filter(({index})=>confirmedQuantities.has(index)).length} / {rows.length}</div><button disabled={importing || !allConfirmed || result.duplicateInvoice} onClick={()=>void commitImport()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-35"><CheckCircleIcon className="h-5 w-5" />{importing ? (isBg ? "Въвеждане..." : "Importing...") : (isBg ? "Добави в наличности" : "Add to stock")}</button></footer>
    </div></div>}
  </div>;
};

export default InvoiceImport;
