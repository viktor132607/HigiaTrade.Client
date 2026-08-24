import { useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Brand = {
  id: string;
  name: string;
  thumbnailImageUrl?: string | null;
  description?: string | null;
  productCount: number;
};

type BrandForm = {
  name: string;
  thumbnailImageUrl: string;
  description: string;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const emptyForm: BrandForm = { name: "", thumbnailImageUrl: "", description: "" };

const AdminBrands = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const text = {
    title: isBg ? "Управление на марки" : "Manage brands",
    subtitle: isBg ? "Създавай портфолио с марки, изображение и описание." : "Build a brand portfolio with an image and description.",
    add: isBg ? "Добави марка" : "Add brand",
    edit: isBg ? "Редактирай марка" : "Edit brand",
    delete: isBg ? "Изтриване на марка" : "Delete brand",
    name: isBg ? "Име" : "Name",
    image: isBg ? "Изображение на марката" : "Brand image",
    description: isBg ? "Описание" : "Description",
    noImage: isBg ? "Няма изображение" : "No image",
    empty: isBg ? "Все още няма добавени марки." : "No brands have been added yet.",
    loading: isBg ? "Зареждане..." : "Loading...",
    uploading: isBg ? "Качване..." : "Uploading...",
    drop: isBg ? "Пусни изображението тук" : "Drop the image here",
    choose: isBg ? "Избери, пусни или постави изображение с Ctrl+V" : "Choose, drop or paste an image with Ctrl+V",
    uploadHelp: isBg ? "До 10 MB. Качва се автоматично след избор, drag & drop или Ctrl+V." : "Up to 10 MB. Uploads automatically after selection, drag & drop or Ctrl+V.",
    removeImage: isBg ? "Премахни изображението" : "Remove image",
    cancel: isBg ? "Отказ" : "Cancel",
    save: isBg ? "Запази" : "Save",
    saving: isBg ? "Запазване..." : "Saving...",
    create: isBg ? "Добави" : "Add",
    deleteButton: isBg ? "Изтрий" : "Delete",
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Brands`, { cache: "no-store" });
      const data = await readApiJson<Brand[]>(response);
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      setBrands([]);
      setError(err instanceof Error ? err.message : isBg ? "Марките не можаха да бъдат заредени." : "Brands could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBrands();
  }, []);

  const openCreate = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setError("");
    setIsDropActive(false);
    setIsModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name, thumbnailImageUrl: brand.thumbnailImageUrl ?? "", description: brand.description ?? "" });
    setError("");
    setIsDropActive(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
    setError("");
    setIsDropActive(false);
  };

  const uploadThumbnail = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(isBg ? "Избери файл с изображение." : "Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(isBg ? "Изображението трябва да е до 10 MB." : "The image must be up to 10 MB.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE_URL}/Images/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      const data = await readApiJson<{ url: string }>(response);
      setForm((current) => ({ ...current, thumbnailImageUrl: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Изображението не можа да бъде качено." : "The image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData || uploading) return;
      const image = Array.from(event.clipboardData.items)
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();
      if (!image) return;
      event.preventDefault();
      void uploadThumbnail(image);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isModalOpen, uploading]);

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      setError(isBg ? "Името на марката трябва да е поне 2 символа." : "Brand name must be at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Brands`, {
        method: editingBrand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...(editingBrand ? { id: editingBrand.id } : {}),
          name,
          thumbnailImageUrl: form.thumbnailImageUrl.trim() || null,
          description: form.description.trim() || null,
        }),
      });
      await readApiJson(response);
      await loadBrands();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Марката не можа да бъде запазена." : "The brand could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async () => {
    if (!brandToDelete) return;
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/Brands/${brandToDelete.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await readApiJson(response);
      setBrandToDelete(null);
      await loadBrands();
    } catch (err) {
      setBrandToDelete(null);
      setError(err instanceof Error ? err.message : isBg ? "Марката не можа да бъде изтрита." : "The brand could not be deleted.");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition hover:bg-[#149f8a]">
          <PlusIcon className="mr-2 h-5 w-5" />
          {text.add}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow">{text.loading}</div>
      ) : brands.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow">{text.empty}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <article key={brand.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => openEdit(brand)} className="block aspect-[16/8] w-full bg-slate-100 text-left">
                {brand.thumbnailImageUrl ? <img src={brand.thumbnailImageUrl} alt={brand.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">{text.noImage}</div>}
              </button>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button type="button" onClick={() => openEdit(brand)} className="text-left text-lg font-bold text-slate-950 hover:underline">{brand.name}</button>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#18b99f]">
                      {isBg ? `${brand.productCount} продукта` : `${brand.productCount} products`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => openEdit(brand)} className="rounded-md bg-yellow-600 p-2 text-white hover:bg-yellow-700" title={text.edit}><PencilIcon className="h-5 w-5" /></button>
                    <button type="button" onClick={() => setBrandToDelete(brand)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" title={text.deleteButton}><TrashIcon className="h-5 w-5" /></button>
                  </div>
                </div>
                {brand.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{brand.description}</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 text-gray-900 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{editingBrand ? text.edit : text.add}</h2>
              <button type="button" onClick={closeModal} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={text.cancel}><XMarkIcon className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveBrand} className="mt-5 space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium">{text.name}</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-md border border-slate-400 px-3 py-2 outline-none focus:border-[#18b99f]" maxLength={80} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{text.image}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadThumbnail(file);
                    event.currentTarget.value = "";
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (!uploading && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => { event.preventDefault(); if (!uploading) setIsDropActive(true); }}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; if (!uploading) setIsDropActive(true); }}
                  onDragLeave={() => setIsDropActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDropActive(false);
                    if (uploading) return;
                    const file = Array.from(event.dataTransfer.files ?? []).find((item) => item.type.startsWith("image/"));
                    if (file) void uploadThumbnail(file);
                    else setError(isBg ? "Пусни валиден файл с изображение." : "Drop a valid image file.");
                  }}
                  className={`flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${isDropActive ? "border-[#18b99f] bg-emerald-50 ring-2 ring-[#18b99f]/20" : "border-slate-300 bg-slate-50 hover:border-[#18b99f] hover:bg-emerald-50"} ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="text-sm font-semibold text-slate-800">{uploading ? text.uploading : isDropActive ? text.drop : text.choose}</div>
                  {!uploading && <div className="mt-1 text-xs text-slate-500">{text.uploadHelp}</div>}
                </div>

                {form.thumbnailImageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img src={form.thumbnailImageUrl} alt={form.name || text.image} className="aspect-[16/8] w-full object-cover" />
                    <button type="button" onClick={() => setForm((current) => ({ ...current, thumbnailImageUrl: "" }))} className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <TrashIcon className="h-4 w-4" />
                      {text.removeImage}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{text.description}</label>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="w-full resize-y rounded-md border border-slate-400 px-3 py-2 outline-none focus:border-[#18b99f]" placeholder={isBg ? "Кратко описание на марката..." : "Short brand description..."} />
              </div>

              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">{text.cancel}</button>
                <button type="submit" disabled={saving || uploading} className="rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a] disabled:opacity-50">{saving ? text.saving : editingBrand ? text.save : text.create}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {brandToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && setBrandToDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold text-slate-950">{text.delete}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isBg ? `Да се изтрие ли „${brandToDelete.name}“? Марка, която е зададена на продукти, не може да бъде изтрита.` : `Delete “${brandToDelete.name}”? A brand assigned to products cannot be deleted.`}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setBrandToDelete(null)} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700">{text.cancel}</button>
              <button type="button" onClick={() => void deleteBrand()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">{text.deleteButton}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
