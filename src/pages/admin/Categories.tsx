import { useEffect, useMemo, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Category = {
  id: string;
  name: string;
  imageURI: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
};

type CategoryApiItem = {
  id: string;
  name: string;
  imageURI?: string | null;
  imageUri?: string | null;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
};

type FormState = {
  name: string;
  imageURI: string;
  isSubcategory: boolean;
  parentCategoryId: string;
};

type TypeFilter = "all" | "category" | "subcategory";
type SortBy = "name" | "type" | "parent";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "adminCategoriesItemsPerPage";
const emptyForm: FormState = {
  name: "",
  imageURI: "",
  isSubcategory: false,
  parentCategoryId: "",
};

const getInitialPageSize = () => {
  if (typeof window === "undefined") return PAGE_SIZE_OPTIONS[0];
  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(saved) ? saved : PAGE_SIZE_OPTIONS[0];
};

const AdminCategories = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [parentFilter, setParentFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDescending, setSortDescending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialPageSize);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const [parentMenuOpen, setParentMenuOpen] = useState(false);
  const [creatingParent, setCreatingParent] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, { cache: "no-store" });
      const data = await readApiJson<CategoryApiItem[]>(response);
      setCategories(
        Array.isArray(data)
          ? data.map((category) => ({
              id: String(category.id),
              name: category.name,
              imageURI: category.imageURI ?? category.imageUri ?? "",
              parentCategoryId: category.parentCategoryId ?? null,
              parentCategoryName: category.parentCategoryName ?? null,
            }))
          : []
      );
    } catch (err) {
      setCategories([]);
      setError(err instanceof Error ? err.message : isBg ? "Категориите не можаха да бъдат заредени." : "Categories could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const mainCategories = useMemo(
    () => categories
      .filter((category) => !category.parentCategoryId)
      .sort((a, b) => a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" })),
    [categories]
  );

  const visibleParentOptions = useMemo(() => {
    const query = parentSearch.trim().toLocaleLowerCase("bg-BG");
    return mainCategories
      .filter((category) => category.id !== editing?.id)
      .filter((category) => !query || category.name.toLocaleLowerCase("bg-BG").includes(query));
  }, [mainCategories, parentSearch, editing?.id]);

  const exactParentExists = useMemo(() => {
    const query = parentSearch.trim().toLocaleLowerCase("bg-BG");
    return mainCategories.some((category) => category.name.trim().toLocaleLowerCase("bg-BG") === query);
  }, [mainCategories, parentSearch]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("bg-BG");
    const result = categories.filter((category) => {
      const isSubcategory = Boolean(category.parentCategoryId);
      if (query && !category.name.toLocaleLowerCase("bg-BG").includes(query) && !(category.parentCategoryName ?? "").toLocaleLowerCase("bg-BG").includes(query)) return false;
      if (typeFilter === "category" && isSubcategory) return false;
      if (typeFilter === "subcategory" && !isSubcategory) return false;
      if (parentFilter && category.parentCategoryId !== parentFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "type") {
        comparison = Number(Boolean(a.parentCategoryId)) - Number(Boolean(b.parentCategoryId));
        if (comparison === 0) comparison = a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" });
      } else if (sortBy === "parent") {
        comparison = (a.parentCategoryName ?? a.name).localeCompare(b.parentCategoryName ?? b.name, "bg-BG", { sensitivity: "base" });
        if (comparison === 0) comparison = a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" });
      } else {
        comparison = a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" });
      }
      return sortDescending ? -comparison : comparison;
    });

    return result;
  }, [categories, search, typeFilter, parentFilter, sortBy, sortDescending]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const pageIds = paginatedCategories.map((category) => category.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const selectedCategories = categories.filter((category) => selectedIds.includes(category.id));

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setParentFilter("");
    setCurrentPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setParentSearch("");
    setParentMenuOpen(false);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      imageURI: category.imageURI,
      isSubcategory: Boolean(category.parentCategoryId),
      parentCategoryId: category.parentCategoryId ?? "",
    });
    setParentSearch(category.parentCategoryName ?? "");
    setParentMenuOpen(false);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setParentSearch("");
    setParentMenuOpen(false);
    setError("");
  };

  const selectParent = (category: Category) => {
    setForm((current) => ({ ...current, parentCategoryId: category.id }));
    setParentSearch(category.name);
    setParentMenuOpen(false);
  };

  const createParentFromSearch = async () => {
    const name = parentSearch.trim();
    if (creatingParent || name.length < 2) return;

    const existing = mainCategories.find(
      (category) => category.name.trim().toLocaleLowerCase("bg-BG") === name.toLocaleLowerCase("bg-BG")
    );
    if (existing) {
      selectParent(existing);
      return;
    }

    try {
      setCreatingParent(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, imageURI: null, parentCategoryId: null }),
      });
      const created = await readApiJson<CategoryApiItem>(response);
      const createdCategory: Category = {
        id: String(created.id),
        name: created.name || name,
        imageURI: created.imageURI ?? created.imageUri ?? "",
        parentCategoryId: null,
        parentCategoryName: null,
      };
      setCategories((current) => [...current, createdCategory]);
      selectParent(createdCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Основната категория не можа да бъде създадена." : "Main category could not be created.");
      setParentMenuOpen(true);
    } finally {
      setCreatingParent(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(isBg ? "Избери валидно изображение." : "Choose a valid image.");
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
      setForm((current) => ({ ...current, imageURI: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Изображението не можа да бъде качено." : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    const handlePaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void uploadImage(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [modalOpen]);

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      setError(isBg ? "Името трябва да е поне 2 символа." : "Name must be at least 2 characters.");
      return;
    }
    if (categories.some((category) => category.id !== editing?.id && category.name.trim().toLocaleLowerCase("bg-BG") === name.toLocaleLowerCase("bg-BG"))) {
      setError(isBg ? "Категория с това име вече съществува." : "A category with this name already exists.");
      return;
    }
    if (form.isSubcategory && !form.parentCategoryId) {
      setError(isBg ? "Избери основна категория над подкатегорията." : "Choose a parent category for the subcategory.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name,
          imageURI: form.imageURI.trim() || null,
          parentCategoryId: form.isSubcategory ? form.parentCategoryId : null,
        }),
      });
      await readApiJson(response);
      await loadCategories();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Категорията не можа да бъде запазена." : "Category could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!deleteTarget) return;
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await readApiJson(response);
      setSelectedIds((current) => current.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Категорията не можа да бъде изтрита." : "Category could not be deleted.");
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    try {
      setBulkDeleting(true);
      setError("");
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          const response = await fetch(`${API_BASE_URL}/Categories/${id}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          await readApiJson(response);
          return id;
        })
      );
      const deleted = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map((result) => result.value);
      const failed = results.length - deleted.length;
      setSelectedIds((current) => current.filter((id) => !deleted.includes(id)));
      setBulkDeleteOpen(false);
      await loadCategories();
      if (failed) setError(isBg ? `${failed} категории не можаха да бъдат изтрити.` : `${failed} categories could not be deleted.`);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{isBg ? "Категории" : "Categories"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isBg ? "Категориите и подкатегориите се управляват на едно място." : "Manage categories and subcategories in one place."}</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 font-semibold text-white hover:bg-[#149f8a]">
          <PlusIcon className="mr-2 h-5 w-5" />{isBg ? "Добави" : "Add"}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-900">{isBg ? "Филтри" : "Filters"}</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_180px_minmax(220px,1fr)_auto] xl:items-end">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            {isBg ? "Търсене" : "Search"}
            <input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder={isBg ? "Име на категория..." : "Category name..."} className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            {isBg ? "Тип" : "Type"}
            <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as TypeFilter); setCurrentPage(1); }} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="all">{isBg ? "Всички" : "All"}</option>
              <option value="category">{isBg ? "Категории" : "Categories"}</option>
              <option value="subcategory">{isBg ? "Подкатегории" : "Subcategories"}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            {isBg ? "Основна категория" : "Parent category"}
            <select value={parentFilter} onChange={(event) => { setParentFilter(event.target.value); setCurrentPage(1); }} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">{isBg ? "Всички" : "All"}</option>
              {mainCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={clearFilters} className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{isBg ? "Изчисти" : "Clear"}</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            {isBg ? "Сортиране:" : "Sort:"}
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} className="rounded-md border-slate-300 text-sm">
              <option value="name">{isBg ? "Име" : "Name"}</option>
              <option value="type">{isBg ? "Тип" : "Type"}</option>
              <option value="parent">{isBg ? "Основна категория" : "Parent category"}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            {isBg ? "Ред:" : "Order:"}
            <select value={sortDescending ? "desc" : "asc"} onChange={(event) => setSortDescending(event.target.value === "desc")} className="rounded-md border-slate-300 text-sm">
              <option value="asc">{isBg ? "Възходящ" : "Ascending"}</option>
              <option value="desc">{isBg ? "Низходящ" : "Descending"}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            {isBg ? "На страница:" : "Per page:"}
            <select value={itemsPerPage} onChange={(event) => { const size = Number(event.target.value); setItemsPerPage(size); setCurrentPage(1); window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size)); }} className="rounded-md border-slate-300 text-sm">
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button type="button" onClick={() => setSelectedIds([])} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{isBg ? "Изчисти избора" : "Clear selection"}</button>
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><TrashIcon className="mr-2 h-5 w-5" />{isBg ? `Изтрий избраните (${selectedIds.length})` : `Delete selected (${selectedIds.length})`}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#18b99f]" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={allPageSelected} onChange={() => setSelectedIds((current) => allPageSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])))} className="h-5 w-5 accent-[#18b99f]" />{isBg ? "Избери" : "Select"}</label></th>
                  <th className="px-4 py-3">{isBg ? "Име" : "Name"}</th>
                  <th className="px-4 py-3">{isBg ? "Тип" : "Type"}</th>
                  <th className="px-4 py-3">{isBg ? "Основна категория" : "Parent category"}</th>
                  <th className="px-4 py-3">{isBg ? "Снимка" : "Image"}</th>
                  <th className="px-4 py-3 text-right">{isBg ? "Действия" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedCategories.map((category) => {
                  const selected = selectedIds.includes(category.id);
                  const isSubcategory = Boolean(category.parentCategoryId);
                  return (
                    <tr key={category.id} className={selected ? "bg-emerald-50" : ""}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected} onChange={() => setSelectedIds((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])} className="h-5 w-5 accent-[#18b99f]" /></td>
                      <td className="px-4 py-3"><button type="button" onClick={() => openEdit(category)} className="font-semibold text-slate-900 hover:underline">{category.name}</button></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isSubcategory ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{isSubcategory ? (isBg ? "Подкатегория" : "Subcategory") : (isBg ? "Категория" : "Category")}</span></td>
                      <td className="px-4 py-3 text-slate-600">{category.parentCategoryName ?? "—"}</td>
                      <td className="px-4 py-3">{category.imageURI ? <img src={category.imageURI} alt="" className="h-12 w-12 rounded-md border border-slate-200 object-cover" /> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(category)} className="mr-2 rounded-md bg-amber-500 p-2 text-white hover:bg-amber-600"><PencilIcon className="h-5 w-5" /></button><button type="button" onClick={() => setDeleteTarget(category)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"><TrashIcon className="h-5 w-5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!paginatedCategories.length && <div className="p-10 text-center text-sm text-slate-500">{isBg ? "Няма категории за показване." : "No categories to show."}</div>}
        </div>
      )}

      {!loading && filteredCategories.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-md bg-[#18b99f] p-2 text-white disabled:bg-slate-200"><ChevronLeftIcon className="h-5 w-5" /></button>
          <span className="text-sm text-slate-700">{isBg ? "Страница" : "Page"} {currentPage} {isBg ? "от" : "of"} {totalPages}</span>
          <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-md bg-[#18b99f] p-2 text-white disabled:bg-slate-200"><ChevronRightIcon className="h-5 w-5" /></button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-3" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="my-4 w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">{editing ? (isBg ? "Редактирай" : "Edit") : (isBg ? "Добави категория / подкатегория" : "Add category / subcategory")}</h2>
              <button type="button" onClick={closeModal} className="rounded-md p-2 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveCategory} className="mt-5 space-y-5">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-semibold text-slate-900">{isBg ? "Подкатегория" : "Subcategory"}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{isBg ? "Отбележи, ако този запис трябва да стои под друга категория." : "Enable if this item belongs under another category."}</div>
                </div>
                <input type="checkbox" checked={form.isSubcategory} onChange={(event) => {
                  const checked = event.target.checked;
                  setForm((current) => ({ ...current, isSubcategory: checked, parentCategoryId: checked ? current.parentCategoryId : "" }));
                  if (!checked) setParentSearch("");
                }} className="h-6 w-6 rounded border-slate-300 accent-[#18b99f]" />
              </label>

              {form.isSubcategory && (
                <div className="relative">
                  <label className="mb-1 block text-sm font-semibold text-slate-900">{isBg ? "Основна категория" : "Parent category"}</label>
                  <input
                    type="text"
                    value={parentSearch}
                    onFocus={() => setParentMenuOpen(true)}
                    onBlur={() => window.setTimeout(() => setParentMenuOpen(false), 160)}
                    onChange={(event) => {
                      setParentSearch(event.target.value);
                      setForm((current) => ({ ...current, parentCategoryId: "" }));
                      setParentMenuOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && parentSearch.trim().length >= 2 && !exactParentExists) {
                        event.preventDefault();
                        void createParentFromSearch();
                      }
                    }}
                    placeholder={isBg ? "Пиши или избери категория..." : "Type or choose a category..."}
                    autoComplete="off"
                    className="min-h-11 w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
                  />
                  {parentMenuOpen && (
                    <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-xl">
                      {visibleParentOptions.map((category) => (
                        <button key={category.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectParent(category)} className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${form.parentCategoryId === category.id ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-700"}`}>{category.name}</button>
                      ))}
                      {!visibleParentOptions.length && <div className="px-3 py-2 text-sm text-slate-500">{isBg ? "Няма намерена категория." : "No category found."}</div>}
                      {parentSearch.trim().length >= 2 && !exactParentExists && (
                        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void createParentFromSearch()} disabled={creatingParent} className="sticky bottom-0 block w-full border-t border-emerald-200 bg-emerald-50 px-3 py-3 text-left text-sm font-semibold text-[#138b78] hover:bg-emerald-100 disabled:opacity-60">{creatingParent ? (isBg ? "Създаване..." : "Creating...") : (isBg ? `+ Създай категория „${parentSearch.trim()}“` : `+ Create category “${parentSearch.trim()}”`)}</button>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{isBg ? "Може да избереш съществуваща категория или да напишеш нова и да я създадеш веднага." : "Choose an existing category or type a new one and create it immediately."}</p>
                </div>
              )}

              <label className="grid gap-1 text-sm font-semibold text-slate-900">
                {isBg ? (form.isSubcategory ? "Име на подкатегория" : "Име на категория") : (form.isSubcategory ? "Subcategory name" : "Category name")}
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="min-h-11 rounded-md border border-slate-400 px-3 py-2 outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20" />
              </label>

              <div>
                <div className="mb-1 text-sm font-semibold text-slate-900">{isBg ? "Изображение (по желание)" : "Image (optional)"}</div>
                {form.imageURI && <img src={form.imageURI} alt="" className="mb-3 h-32 w-full rounded-lg border border-slate-200 object-contain" />}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{uploading ? (isBg ? "Качване..." : "Uploading...") : (isBg ? "Качи изображение" : "Upload image")}</button>
                  {form.imageURI && <button type="button" onClick={() => setForm((current) => ({ ...current, imageURI: "" }))} className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">{isBg ? "Премахни" : "Remove"}</button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">{isBg ? "Отказ" : "Cancel"}</button>
                <button type="submit" disabled={saving} className="rounded-md bg-[#18b99f] px-5 py-2 font-semibold text-white hover:bg-[#149f8a] disabled:opacity-50">{saving ? (isBg ? "Запазване..." : "Saving...") : (isBg ? "Запази" : "Save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">{isBg ? "Изтриване" : "Delete"}</h2>
            <p className="mt-3 text-slate-600">{isBg ? `Да се изтрие ли „${deleteTarget.name}“?` : `Delete “${deleteTarget.name}”?`}</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-md border border-slate-300 px-4 py-2">{isBg ? "Отказ" : "Cancel"}</button><button type="button" onClick={() => void deleteCategory()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white">{isBg ? "Изтрий" : "Delete"}</button></div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && setBulkDeleteOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">{isBg ? "Изтриване на избрани" : "Delete selected"}</h2>
            <p className="mt-3 text-slate-600">{isBg ? `Ще бъдат изтрити ${selectedIds.length} записа.` : `${selectedIds.length} items will be deleted.`}</p>
            <div className="mt-3 max-h-40 overflow-y-auto rounded-md bg-slate-50 p-3 text-sm text-slate-600">{selectedCategories.map((category) => <div key={category.id}>{category.name}</div>)}</div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setBulkDeleteOpen(false)} className="rounded-md border border-slate-300 px-4 py-2">{isBg ? "Отказ" : "Cancel"}</button><button type="button" onClick={() => void deleteSelected()} disabled={bulkDeleting} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{bulkDeleting ? (isBg ? "Изтриване..." : "Deleting...") : (isBg ? "Изтрий" : "Delete")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
