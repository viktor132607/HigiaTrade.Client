import { useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";

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

const emptyForm: BrandForm = {
  name: "",
  thumbnailImageUrl: "",
  description: "",
};

const AdminBrands = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Brands`, { cache: "no-store" });
      const data = await readApiJson<Brand[]>(response);
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      setBrands([]);
      setError(err instanceof Error ? err.message : "Марките не можаха да бъдат заредени.");
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
    setIsModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      thumbnailImageUrl: brand.thumbnailImageUrl ?? "",
      description: brand.description ?? "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
    setError("");
  };

  const uploadThumbnail = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Избери файл с изображение.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Изображението трябва да е до 10 MB.");
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
      setError(err instanceof Error ? err.message : "Изображението не можа да бъде качено.");
    } finally {
      setUploading(false);
    }
  };

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();

    if (name.length < 2) {
      setError("Името на марката трябва да е поне 2 символа.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Brands`, {
        method: editingBrand ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      setError(err instanceof Error ? err.message : "Марката не можа да бъде запазена.");
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
      setError(
        err instanceof Error
          ? err.message
          : "Марката не можа да бъде изтрита. Премахни я първо от продуктите.",
      );
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление на марки</h1>
          <p className="mt-1 text-sm text-gray-500">Създавай портфолио с марки, thumbnail изображение и описание.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition hover:bg-[#149f8a]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Добави марка
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow">Зареждане...</div>
      ) : brands.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow">Все още няма добавени марки.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <article key={brand.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button type="button" onClick={() => openEdit(brand)} className="block aspect-[16/8] w-full bg-slate-100 text-left">
                {brand.thumbnailImageUrl ? (
                  <img src={brand.thumbnailImageUrl} alt={brand.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">Няма thumbnail</div>
                )}
              </button>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-950">{brand.name}</h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#18b99f]">
                      {brand.productCount} продукта
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => openEdit(brand)} className="rounded-md bg-yellow-600 p-2 text-white hover:bg-yellow-700" title="Редактирай">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => setBrandToDelete(brand)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" title="Изтрий">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {brand.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{brand.description}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
            <h2 className="text-xl font-bold">{editingBrand ? "Редактирай марка" : "Добави марка"}</h2>
            <form onSubmit={saveBrand} className="mt-5 space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium">Име</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#18b99f]"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Thumbnail изображение</label>
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-700 transition hover:border-[#18b99f] disabled:opacity-50"
                >
                  {uploading ? "Качване..." : "Качи thumbnail от компютъра"}
                </button>

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">или URL</label>
                  <input
                    value={form.thumbnailImageUrl}
                    onChange={(event) => setForm((current) => ({ ...current, thumbnailImageUrl: event.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#18b99f]"
                  />
                </div>

                {form.thumbnailImageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img src={form.thumbnailImageUrl} alt="Thumbnail preview" className="aspect-[16/8] w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#18b99f]"
                  placeholder="Кратко описание на марката..."
                />
              </div>

              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Отказ</button>
                <button type="submit" disabled={saving || uploading} className="rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a] disabled:opacity-50">
                  {saving ? "Запазване..." : editingBrand ? "Запази" : "Добави"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {brandToDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && setBrandToDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Изтриване на марка</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Да се изтрие ли „{brandToDelete.name}“? Марка, която е зададена на продукти, не може да бъде изтрита.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setBrandToDelete(null)} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700">Отказ</button>
              <button type="button" onClick={() => void deleteBrand()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Изтрий</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrands;
