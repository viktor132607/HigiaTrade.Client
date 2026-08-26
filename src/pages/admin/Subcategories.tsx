import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Category = {
  id: string;
  name: string;
  imageURI?: string | null;
  imageUri?: string | null;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
};

type FormState = {
  name: string;
  parentCategoryId: string;
  imageURI: string;
};

const emptyForm: FormState = { name: "", parentCategoryId: "", imageURI: "" };

const AdminSubcategories = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [sortDescending, setSortDescending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, { cache: "no-store" });
      const data = await readApiJson<Category[]>(response);
      setCategories(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Категориите не можаха да бъдат заредени." : "Categories could not be loaded.");
    }
  };

  useEffect(() => { void load(); }, []);

  const parents = useMemo(
    () => categories.filter((category) => !category.parentCategoryId).sort((a, b) => a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" })),
    [categories]
  );

  const subcategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("bg-BG");
    const result = categories.filter((category) => {
      if (!category.parentCategoryId) return false;
      if (parentFilter && category.parentCategoryId !== parentFilter) return false;
      if (query && !category.name.toLocaleLowerCase("bg-BG").includes(query) && !(category.parentCategoryName ?? "").toLocaleLowerCase("bg-BG").includes(query)) return false;
      return true;
    });
    result.sort((a, b) => {
      const parentCompare = (a.parentCategoryName ?? "").localeCompare(b.parentCategoryName ?? "", "bg-BG", { sensitivity: "base" });
      const compare = parentCompare || a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" });
      return sortDescending ? -compare : compare;
    });
    return result;
  }, [categories, search, parentFilter, sortDescending]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      parentCategoryId: category.parentCategoryId ?? "",
      imageURI: category.imageURI ?? category.imageUri ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      setUploading(true);
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE_URL}/Images/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      const data = await readApiJson<{ url: string }>(response);
      setForm((current) => ({ ...current, imageURI: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Снимката не можа да бъде качена." : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError(isBg ? "Името трябва да е поне 2 символа." : "Name must be at least 2 characters.");
      return;
    }
    if (!form.parentCategoryId) {
      setError(isBg ? "Избери основна категория." : "Choose a parent category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name: form.name.trim(),
          imageURI: form.imageURI.trim() || null,
          parentCategoryId: form.parentCategoryId,
        }),
      });
      await readApiJson(response);
      await load();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Подкатегорията не можа да бъде запазена." : "Subcategory could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOne = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`${API_BASE_URL}/Categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await readApiJson(response);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Подкатегорията не можа да бъде изтрита." : "Subcategory could not be deleted.");
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(selectedIds.map(async (id) => {
        const response = await fetch(`${API_BASE_URL}/Categories/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        await readApiJson(response);
      }));
      setBulkDeleteOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Някои подкатегории не можаха да бъдат изтрити." : "Some subcategories could not be deleted.");
    }
  };

  const allSelected = subcategories.length > 0 && subcategories.every((item) => selectedIds.includes(item.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-950">{isBg ? "Управление на подкатегории" : "Manage subcategories"}</h1><p className="mt-1 text-sm text-slate-500">{isBg ? "Всяка подкатегория принадлежи към една основна категория." : "Each subcategory belongs to one main category."}</p></div>
        <button type="button" onClick={openAdd} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a]"><PlusIcon className="mr-2 h-5 w-5" />{isBg ? "Добави подкатегория" : "Add subcategory"}</button>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(240px,1fr)_minmax(220px,1fr)_180px_auto] md:items-end">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">{isBg ? "Търсене" : "Search"}<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isBg ? "Име на подкатегория..." : "Subcategory name..."} className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">{isBg ? "Основна категория" : "Main category"}<select value={parentFilter} onChange={(event) => setParentFilter(event.target.value)} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">{isBg ? "Всички категории" : "All categories"}</option>{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">{isBg ? "Ред" : "Order"}<select value={sortDescending ? "desc" : "asc"} onChange={(event) => setSortDescending(event.target.value === "desc")} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="asc">А-Я</option><option value="desc">Я-А</option></select></label>
        <button type="button" onClick={() => { setSearch(""); setParentFilter(""); }} className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{isBg ? "Изчисти" : "Clear"}</button>
      </div>

      {selectedIds.length > 0 && <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setSelectedIds([])} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">{isBg ? "Изчисти избора" : "Clear selection"}</button><button type="button" onClick={() => setBulkDeleteOpen(true)} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"><TrashIcon className="mr-2 h-5 w-5" />{isBg ? `Изтрий избраните (${selectedIds.length})` : `Delete selected (${selectedIds.length})`}</button></div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : subcategories.map((item) => item.id))} className="h-5 w-5 accent-[#18b99f]" />{isBg ? "Избери" : "Select"}</label></th><th className="px-4 py-3">{isBg ? "Подкатегория" : "Subcategory"}</th><th className="px-4 py-3">{isBg ? "Основна категория" : "Main category"}</th><th className="px-4 py-3">{isBg ? "Снимка" : "Image"}</th><th className="px-4 py-3 text-right">{isBg ? "Действия" : "Actions"}</th></tr></thead>
            <tbody className="divide-y divide-slate-200">{subcategories.map((category) => { const image = category.imageURI ?? category.imageUri ?? ""; const selected = selectedIds.includes(category.id); return <tr key={category.id} className={selected ? "bg-emerald-50" : ""}><td className="px-4 py-3"><input type="checkbox" checked={selected} onChange={() => setSelectedIds((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])} className="h-5 w-5 accent-[#18b99f]" /></td><td className="px-4 py-3 font-semibold text-slate-900">{category.name}</td><td className="px-4 py-3 text-slate-600">{category.parentCategoryName ?? parents.find((item) => item.id === category.parentCategoryId)?.name ?? "—"}</td><td className="px-4 py-3">{image ? <img src={image} alt="" className="h-12 w-12 rounded-md border border-slate-200 object-cover" /> : <span className="text-slate-400">—</span>}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(category)} className="mr-2 rounded-md bg-amber-500 p-2 text-white"><PencilIcon className="h-5 w-5" /></button><button type="button" onClick={() => setDeleteTarget(category)} className="rounded-md bg-red-600 p-2 text-white"><TrashIcon className="h-5 w-5" /></button></td></tr>; })}</tbody>
          </table>
        </div>
        {subcategories.length === 0 && <div className="p-8 text-center text-sm text-slate-500">{isBg ? "Няма подкатегории за показване." : "No subcategories to show."}</div>}
      </div>

      {modalOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}><div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? (isBg ? "Редактирай подкатегория" : "Edit subcategory") : (isBg ? "Добави подкатегория" : "Add subcategory")}</h2><button type="button" onClick={closeModal} className="p-2"><XMarkIcon className="h-5 w-5" /></button></div><form onSubmit={save} className="mt-5 space-y-4"><label className="grid gap-1 text-sm font-semibold">{isBg ? "Основна категория" : "Main category"}<select value={form.parentCategoryId} onChange={(event) => setForm((current) => ({ ...current, parentCategoryId: event.target.value }))} className="min-h-11 rounded-md border border-slate-400 bg-white px-3 py-2"><option value="">{isBg ? "Избери категория" : "Choose category"}</option>{parents.filter((parent) => parent.id !== editing?.id).map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">{isBg ? "Име на подкатегория" : "Subcategory name"}<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="min-h-11 rounded-md border border-slate-400 px-3 py-2" /></label><label className="grid gap-1 text-sm font-semibold">{isBg ? "URL на снимка (по желание)" : "Image URL (optional)"}<input value={form.imageURI} onChange={(event) => setForm((current) => ({ ...current, imageURI: event.target.value }))} className="min-h-11 rounded-md border border-slate-400 px-3 py-2" /></label><label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold">{uploading ? (isBg ? "Качване..." : "Uploading...") : (isBg ? "Качи снимка" : "Upload image")}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label>{form.imageURI && <img src={form.imageURI} alt="" className="max-h-48 w-full rounded-lg border border-slate-200 object-contain" />}<div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={closeModal} className="rounded-md border border-slate-300 px-4 py-2">{isBg ? "Отказ" : "Cancel"}</button><button type="submit" disabled={saving} className="rounded-md bg-[#18b99f] px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? (isBg ? "Запазване..." : "Saving...") : (isBg ? "Запази" : "Save")}</button></div></form></div></div>}

      {deleteTarget && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{isBg ? "Изтриване на подкатегория" : "Delete subcategory"}</h2><p className="mt-3 text-slate-600">{isBg ? `Да се изтрие ли „${deleteTarget.name}“?` : `Delete “${deleteTarget.name}”?`}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border border-slate-300 px-4 py-2">{isBg ? "Отказ" : "Cancel"}</button><button type="button" onClick={() => void deleteOne()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white">{isBg ? "Изтрий" : "Delete"}</button></div></div></div>}

      {bulkDeleteOpen && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{isBg ? "Изтриване на избрани подкатегории" : "Delete selected subcategories"}</h2><p className="mt-3 text-slate-600">{isBg ? `Ще бъдат изтрити ${selectedIds.length} подкатегории.` : `${selectedIds.length} subcategories will be deleted.`}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setBulkDeleteOpen(false)} className="rounded-md border border-slate-300 px-4 py-2">{isBg ? "Отказ" : "Cancel"}</button><button type="button" onClick={() => void deleteSelected()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white">{isBg ? "Изтрий" : "Delete"}</button></div></div></div>}
    </div>
  );
};

export default AdminSubcategories;
