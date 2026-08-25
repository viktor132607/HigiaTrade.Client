import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircleIcon, CloudArrowUpIcon, DocumentTextIcon, ExclamationTriangleIcon, PhotoIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type ProductCandidate = { id: string; name: string; confidence: number };
type CatalogProduct = { id: string; name: string };
type CategoryOption = { id: string; name: string };
type ExtractedItem = { rawName: string; quantity: number; matchedProductId: string | null; matchedProductName: string | null; matchConfidence: number; quantityConfidence: number; candidates: ProductCandidate[]; sourceLine: string };
type ExtractResponse = { fileName: string; detectedLanguage: string; invoiceNumber: string | null; invoiceDate: string | null; duplicateInvoice: boolean; items: ExtractedItem[]; textPreview: string };
type EditableItem = ExtractedItem & { selectedProductId: string; editableProductName: string; editableQuantity: string };

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const fileKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`;

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
  const [files, setFiles] = useState<File[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [newProductRow, setNewProductRow] = useState<number | null>(null);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);
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

  const file = files[activeFileIndex] ?? null;
  const isPdf = Boolean(file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const validRowsWithIndexes = useMemo(() => rows.map((row, index) => ({ row, index })).filter(({ row }) => Boolean(row.selectedProductId) && Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0), [rows]);
  const allConfirmed = rows.length > 0 && rows.every((row, index) => Boolean(row.selectedProductId) && Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0 && confirmedNames.has(index) && confirmedQuantities.has(index));

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
    const loadCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`, { headers: authHeaders });
        const payload = await response.json().catch(() => null);
        if (!response.ok) return;
        const values = collectNamed(payload);
        setCategories(values);
        if (values.length) setNewCategoryId((current) => current || values[0].id);
      } catch { }
    };
    void loadCategories();
  }, [token]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const resetConfirmation = (index: number, type: "name" | "qty") => {
    const setter = type === "name" ? setConfirmedNames : setConfirmedQuantities;
    setter((current) => { const next = new Set(current); next.delete(index); return next; });
  };
  const toggle = (index: number, type: "name" | "qty") => {
    const setter = type === "name" ? setConfirmedNames : setConfirmedQuantities;
    setter((current) => { const next = new Set(current); next.has(index) ? next.delete(index) : next.add(index); return next; });
  };
  const confirmAllQuantities = () => setConfirmedQuantities(new Set(rows.map((row, index) => ({ row, index })).filter(({ row }) => Number.isInteger(Number(row.editableQuantity)) && Number(row.editableQuantity) > 0).map(({ index }) => index)));

  const resetReview = () => { setResult(null); setRows([]); setConfirmedNames(new Set()); setConfirmedQuantities(new Set()); setInvoiceNumber(""); setReviewOpen(false); setProgress(0); setError(""); setNewProductRow(null); };

  const selectFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const incoming = Array.from(selected);
    const invalid = incoming.find((candidate) => !ACCEPTED_EXTENSIONS.some((ext) => candidate.name.toLowerCase().endsWith(ext)) || candidate.size > MAX_FILE_SIZE);
    if (invalid) { setError(isBg ? `Невалиден файл: ${invalid.name}` : `Invalid file: ${invalid.name}`); return; }
    setFiles((current) => {
      const existing = new Set(current.map(fileKey));
      return [...current, ...incoming.filter((candidate) => !existing.has(fileKey(candidate)))];
    });
    if (files.length === 0) setActiveFileIndex(0);
    setError("");
  };

  const extractInvoice = async () => {
    if (!file) return;
    try {
      setExtracting(true); setError(""); setProgress(10);
      const formData = new FormData(); formData.append("file", file); setProgress(20);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/extract`, { method: "POST", headers: authHeaders, body: formData });
      setProgress(90);
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "OCR error");
      const data = payload as ExtractResponse;
      const cleanItems = (data.items ?? []).filter(isRealItem);
      setResult({ ...data, items: cleanItems }); setInvoiceNumber(data.invoiceNumber ?? "");
      setRows(cleanItems.map((item) => ({ ...item, selectedProductId: item.matchedProductId ?? "", editableProductName: item.matchedProductName ?? item.rawName, editableQuantity: String(item.quantity || "") })));
      setConfirmedNames(new Set()); setConfirmedQuantities(new Set()); setProgress(100); setReviewOpen(true);
    } catch (e) { setError(e instanceof Error ? e.message : "OCR error"); }
    finally { setExtracting(false); }
  };

  const createProductForRow = async (index: number) => {
    const row = rows[index];
    const title = row?.editableProductName.trim();
    if (!title || !newCategoryId) return;
    try {
      setCreatingProduct(true); setError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, brand: null, description: title, mainImageUrl: "", isActive: true, regularPrice: 0, discountPercentage: 0, discountedPrice: 0, wholesalePrice: 0, wholesaleMinQuantity: 0, vatRate: 20, quantity: 0, categoryId: newCategoryId, secondaryImages: [] })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || (isBg ? "Продуктът не беше добавен." : "Product was not added."));
      await loadCatalog();
      const created = collectNamed(payload).find((p) => p.name.trim().toLocaleLowerCase() === title.toLocaleLowerCase());
      let createdId = created?.id ?? "";
      if (!createdId) {
        const reload = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`, { headers: authHeaders });
        const reloadPayload = await reload.json().catch(() => null);
        createdId = collectNamed(reloadPayload).find((p) => p.name.trim().toLocaleLowerCase() === title.toLocaleLowerCase())?.id ?? "";
      }
      if (!createdId) throw new Error(isBg ? "Продуктът е създаден, но не беше намерен в каталога." : "Product created but could not be found in catalog.");
      setRows((current) => current.map((item, i) => i === index ? { ...item, selectedProductId: createdId, editableProductName: title } : item));
      setNewProductRow(null);
      toast.success(isBg ? "Новият продукт е добавен в каталога и избран." : "New product added to catalog and selected.");
    } catch (e) { setError(e instanceof Error ? e.message : "Create product failed"); }
    finally { setCreatingProduct(false); }
  };

  const commitImport = async () => {
    if (!result || !allConfirmed || !invoiceNumber.trim() || !file) return;
    try {
      setImporting(true); setError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/InvoiceImport/commit`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ invoiceNumber: invoiceNumber.trim(), items: rows.map((row) => ({ productId: row.selectedProductId, quantity: Number(row.editableQuantity) })) }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Import failed");
      toast.success(isBg ? "Фактурата е въведена и махната от опашката." : "Invoice imported and removed from queue.");
      const removedIndex = activeFileIndex;
      setFiles((current) => current.filter((_, index) => index !== removedIndex));
      setActiveFileIndex((current) => Math.max(0, current - (removedIndex > 0 ? 1 : 0)));
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
      {files.length > 0 && <div className="mx-auto mt-4 grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-3">{files.map((candidate, index) => <button key={fileKey(candidate)} type="button" onClick={() => { setActiveFileIndex(index); resetReview(); }} className={`rounded-xl border px-4 py-3 text-left ${index === activeFileIndex ? "border-[#18b99f] bg-[#18b99f]/10" : "border-slate-200 bg-slate-50"}`}><div className="truncate font-black text-slate-950">{candidate.name}</div><div className="mt-1 text-xs text-slate-500">{(candidate.size / 1024 / 1024).toFixed(2)} MB · {isBg ? "чака потвърждение" : "pending"}</div></button>)}</div>}
      <div className="mt-5 flex justify-center gap-2"><button onClick={() => fileInputRef.current?.click()} className="rounded-lg border px-5 py-3 font-bold">{isBg ? "Добави още фактури" : "Add more invoices"}</button><button disabled={!file || extracting} onClick={() => void extractInvoice()} className="rounded-lg bg-[#18b99f] px-5 py-3 font-bold text-white disabled:opacity-40">{extracting ? (isBg ? "Разчитане..." : "Reading...") : (isBg ? `Разчети ${file?.name ?? "фактурата"}` : `Read ${file?.name ?? "invoice"}`)}</button></div>
      {(extracting || progress > 0) && <div className="mx-auto mt-5 max-w-3xl"><div className="mb-1 flex justify-between text-xs font-bold"><span className="truncate pr-4">{file?.name}</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-[#18b99f]" style={{ width: `${progress}%` }} /></div></div>}
    </div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700"><ExclamationTriangleIcon className="mr-2 inline h-5 w-5" />{error}</div>}

    {result && reviewOpen && <div className="fixed inset-0 z-[100] bg-slate-950/80 p-1"><div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white">
      <header className="flex items-center justify-between border-b px-5 py-3"><div className="flex flex-wrap items-center gap-6"><h2 className="text-2xl font-black">{isBg ? "Проверка" : "Verification"}</h2><label className="flex items-center gap-2 font-bold">{isBg ? "Фактура №" : "Invoice no."}<input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="rounded-lg border px-3 py-2 font-black" /></label><div className="font-bold">{isBg ? "Дата" : "Date"}: <span className="font-black">{result.invoiceDate || "—"}</span></div></div><button onClick={() => setReviewOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border"><XMarkIcon className="h-6 w-6" /></button></header>
      <div className="grid min-h-0 flex-1 grid-cols-[40%_60%] overflow-hidden">
        <section className="min-h-0 border-r bg-slate-100"><div className="border-b bg-white px-4 py-2 text-xs font-black uppercase text-slate-600">{isBg ? "Оригинална фактура" : "Original invoice"}</div><div className="h-[calc(100%-37px)] overflow-auto p-2">{isPdf ? <iframe title="Original invoice" src={previewUrl} className="h-full min-h-[700px] w-full border-0 bg-white" /> : <img src={previewUrl} alt={file?.name || "Invoice"} className="mx-auto max-h-none w-full object-contain bg-white" />}</div></section>
        <section className="min-h-0 overflow-auto p-3"><table className="w-full min-w-[850px] text-sm"><thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-black uppercase text-slate-600"><tr><th className="w-[50%] px-3 py-3">{isBg ? `Продукт (${catalog.length} в каталога)` : `Product (${catalog.length} in catalog)`}</th><th className="w-[18%] px-3 py-3 text-center">{isBg ? "Потвърди име" : "Confirm name"}</th><th className="w-[14%] px-3 py-3 text-right">{isBg ? "Количество" : "Quantity"}</th><th className="w-[18%] px-3 py-3 text-center"><button type="button" onClick={confirmAllQuantities} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-black text-emerald-800">{isBg ? "Потвърди всички количества" : "Confirm all quantities"}</button></th></tr></thead>
        <tbody className="divide-y">{rows.map((row, index) => { const productValid = Boolean(row.selectedProductId); const qty = Number(row.editableQuantity); const qtyValid = Number.isInteger(qty) && qty > 0; const nc = confirmedNames.has(index); const qc = confirmedQuantities.has(index); return <tr key={`${row.sourceLine}-${index}`} className={nc && qc ? "bg-emerald-50/50" : "bg-white"}>
          <td className="px-3 py-3"><div className="mb-1 text-xs font-bold text-slate-500">{isBg ? "От фактурата:" : "From invoice:"} <span className="text-slate-950">{row.rawName}</span></div><select value={row.selectedProductId} onChange={(e) => { const id=e.target.value; const p=catalog.find((x)=>x.id===id); setRows((current)=>current.map((item,i)=>i===index?{...item,selectedProductId:id,editableProductName:p?.name ?? item.editableProductName}:item)); resetConfirmation(index,"name"); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-semibold"><option value="">— {isBg ? `Избери от всички ${catalog.length} продукта` : `Choose from all ${catalog.length} products`} —</option>{catalog.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="mt-2 flex gap-2"><input value={row.editableProductName} onChange={(e)=>{const value=e.target.value;setRows((current)=>current.map((item,i)=>i===index?{...item,editableProductName:value,selectedProductId:""}:item));resetConfirmation(index,"name");}} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 font-semibold" placeholder={isBg?"Име за нов продукт":"New product name"}/><button type="button" onClick={()=>{setNewProductRow(index);setNewCategoryId((c)=>c||categories[0]?.id||"");}} className="inline-flex items-center gap-1 rounded-lg border border-[#18b99f] px-3 font-black text-[#0b8f7a]"><PlusIcon className="h-4 w-4" />{isBg?"Добави нов":"Add new"}</button></div>{newProductRow===index&&<div className="mt-2 flex gap-2 rounded-lg bg-slate-50 p-2"><select value={newCategoryId} onChange={(e)=>setNewCategoryId(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border px-2"><option value="">{isBg?"Избери категория":"Choose category"}</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" disabled={!newCategoryId||!row.editableProductName.trim()||creatingProduct} onClick={()=>void createProductForRow(index)} className="rounded-lg bg-slate-950 px-3 font-black text-white disabled:opacity-40">{creatingProduct?(isBg?"Добавяне...":"Adding..."):(isBg?"Запиши в каталога":"Save to catalog")}</button><button type="button" onClick={()=>setNewProductRow(null)} className="rounded-lg border px-3">{isBg?"Отказ":"Cancel"}</button></div>}</td>
          <td className="px-3 py-3 text-center"><button disabled={!productValid} onClick={()=>toggle(index,"name")} className={`rounded-lg border px-3 py-2 font-black ${nc?"bg-emerald-500 text-white":productValid?"border-emerald-300 bg-emerald-50 text-emerald-800":"bg-slate-100 text-slate-400"}`}>{nc?(isBg?"Потвърдено":"Confirmed"):(isBg?"Потвърди име":"Confirm name")}</button></td>
          <td className="px-3 py-3 text-right"><input type="number" min="1" step="1" value={row.editableQuantity} onChange={(e)=>{const value=e.target.value;setRows((c)=>c.map((x,i)=>i===index?{...x,editableQuantity:value}:x));resetConfirmation(index,"qty");}} className="w-24 rounded-lg border px-2 py-2 text-right text-base font-black" /></td>
          <td className="px-3 py-3 text-center"><button disabled={!qtyValid} onClick={()=>toggle(index,"qty")} className={`rounded-lg border px-3 py-2 font-black ${qc?"bg-emerald-500 text-white":qtyValid?"border-emerald-300 bg-emerald-50 text-emerald-800":"bg-slate-100 text-slate-400"}`}>{qc?(isBg?"Потвърдено":"Confirmed"):(isBg?"Потвърди количество":"Confirm quantity")}</button></td>
        </tr>; })}</tbody></table></section>
      </div>
      <footer className="flex items-center justify-between border-t bg-slate-50 px-5 py-4"><div className="font-bold">{validRowsWithIndexes.filter(({index})=>confirmedNames.has(index)&&confirmedQuantities.has(index)).length} / {rows.length}</div><button disabled={importing || !allConfirmed || result.duplicateInvoice} onClick={()=>void commitImport()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-35"><CheckCircleIcon className="h-5 w-5" />{isBg ? "Добави в наличности" : "Add to stock"}</button></footer>
    </div></div>}
  </div>;
};

export default InvoiceImport;
