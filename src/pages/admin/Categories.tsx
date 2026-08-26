import { useEffect, useMemo, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Category {
  id: string;
  name: string;
  productCount: number;
  imageURI: string;
}

interface CategoryApiItem {
  id: string;
  name: string;
  productCount?: number;
  imageURI?: string | null;
  imageUri?: string | null;
}

interface FormData {
  name: string;
  imageURI: string;
}

interface ValidationErrors {
  name?: string;
}

type CategorySort = "name" | "productCount";
type ProductFilter = "all" | "withProducts" | "empty";
type ImageFilter = "all" | "withImage" | "withoutImage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "adminCategoriesItemsPerPage";
const emptyForm: FormData = { name: "", imageURI: "" };

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [uploading, setUploading] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [imageFilter, setImageFilter] = useState<ImageFilter>("all");
  const [sortBy, setSortBy] = useState<CategorySort>("name");
  const [sortDescending, setSortDescending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialPageSize);

  const text = {
    title: isBg ? "Управление на категории" : "Manage categories",
    add: isBg ? "Добави категория" : "Add category",
    edit: isBg ? "Редактирай категория" : "Edit category",
    deleteTitle: isBg ? "Изтриване на категория" : "Delete category",
    bulkDeleteTitle: isBg ? "Изтриване на избрани категории" : "Delete selected categories",
    name: isBg ? "Име" : "Name",
    products: isBg ? "Продукти" : "Products",
    actions: isBg ? "Действия" : "Actions",
    image: isBg ? "Изображение на категорията" : "Category image",
    choose: isBg ? "Избери, пусни или постави изображение с Ctrl+V" : "Choose, drop or paste an image with Ctrl+V",
    drop: isBg ? "Пусни изображението тук" : "Drop the image here",
    uploading: isBg ? "Качване..." : "Uploading...",
    help: isBg ? "До 10 MB. Качва се автоматично след избор, drag & drop или Ctrl+V." : "Up to 10 MB. Uploads automatically after selection, drag & drop or Ctrl+V.",
    remove: isBg ? "Премахни изображението" : "Remove image",
    full: isBg ? "Отвори изображението в цял размер" : "Open image full size",
    cancel: isBg ? "Отказ" : "Cancel",
    save: isBg ? "Запази" : "Save",
    delete: isBg ? "Изтрий" : "Delete",
    noImage: isBg ? "Няма изображение" : "No image",
    search: isBg ? "Търси по име" : "Search by name",
    searchPlaceholder: isBg ? "Напр. Добавки" : "E.g. Additives",
    filterProducts: isBg ? "По продукти" : "By products",
    filterImages: isBg ? "По изображение" : "By image",
    all: isBg ? "Всички" : "All",
    withProducts: isBg ? "С продукти" : "With products",
    empty: isBg ? "Без продукти" : "Without products",
    withImage: isBg ? "С изображение" : "With image",
    withoutImage: isBg ? "Без изображение" : "Without image",
    sortBy: isBg ? "Сортиране по:" : "Sort by:",
    order: isBg ? "Ред:" : "Order:",
    ascending: isBg ? "Възходящ" : "Ascending",
    descending: isBg ? "Низходящ" : "Descending",
    perPage: isBg ? "На страница:" : "Per page:",
    clear: isBg ? "Изчисти" : "Clear",
    clearSelection: isBg ? "Изчисти избора" : "Clear selection",
    select: isBg ? "Избери" : "Select",
    deleteSelected: isBg ? "Изтрий избраните" : "Delete selected",
    noResults: isBg ? "Няма категории за показване." : "No categories to show.",
    page: isBg ? "Страница" : "Page",
    of: isBg ? "от" : "of",
  };

  const fetchCategories = async () => {
    try {
      setError("");
      const response = await fetch(`${API_BASE_URL}/Categories`, { cache: "no-store" });
      const data = await readApiJson<CategoryApiItem[]>(response);
      setCategories(
        Array.isArray(data)
          ? data.map((category) => ({
              id: category.id,
              name: category.name,
              productCount: category.productCount ?? 0,
              imageURI: category.imageURI ?? category.imageUri ?? "",
            }))
          : []
      );
    } catch (err) {
      setCategories([]);
      setError(err instanceof Error ? err.message : isBg ? "Категориите не можаха да бъдат заредени." : "Categories could not be loaded.");
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const filteredAndSortedCategories = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("bg-BG");
    const result = categories.filter((category) => {
      if (query && !category.name.toLocaleLowerCase("bg-BG").includes(query)) return false;
      if (productFilter === "withProducts" && category.productCount <= 0) return false;
      if (productFilter === "empty" && category.productCount > 0) return false;
      if (imageFilter === "withImage" && !category.imageURI.trim()) return false;
      if (imageFilter === "withoutImage" && category.imageURI.trim()) return false;
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "productCount") comparison = a.productCount - b.productCount;
      else comparison = a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" });
      return sortDescending ? -comparison : comparison;
    });

    return result;
  }, [categories, searchTerm, productFilter, imageFilter, sortBy, sortDescending]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCategories.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCategories.slice(start, start + itemsPerPage);
  }, [filteredAndSortedCategories, currentPage, itemsPerPage]);

  const hasActiveFilters = Boolean(searchTerm.trim() || productFilter !== "all" || imageFilter !== "all");
  const pageIds = paginatedCategories.map((category) => category.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedCategoryIds.includes(id));
  const selectedCategories = categories.filter((category) => selectedCategoryIds.includes(category.id));

  const clearFilters = () => {
    setSearchTerm("");
    setProductFilter("all");
    setImageFilter("all");
    setCurrentPage(1);
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId]
    );
  };

  const toggleAllCategoriesOnPage = () => {
    setSelectedCategoryIds((previous) =>
      allPageSelected
        ? previous.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...previous, ...pageIds]))
    );
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, size.toString());
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};
    const name = formData.name.trim();
    if (!name) errors.name = isBg ? "Името на категорията е задължително." : "Category name is required.";
    else if (name.length < 2) errors.name = isBg ? "Използвай поне 2 символа." : "Use at least 2 characters.";
    else if (name.length > 50) errors.name = isBg ? "Използвай до 50 символа." : "Use up to 50 characters.";
    else if (categories.some((category) => category.name.toLocaleLowerCase("bg-BG") === name.toLocaleLowerCase("bg-BG") && category.id !== editingCategory?.id)) {
      errors.name = isBg ? "Категория с това име вече съществува." : "A category with this name already exists.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(emptyForm);
    setFullImageUrl(null);
    setValidationErrors({});
    setError("");
    setDropActive(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, imageURI: category.imageURI });
    setError("");
    setValidationErrors({});
    setDropActive(false);
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setError("");
    setValidationErrors({});
    setDropActive(false);
    setIsModalOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(isBg ? "Избери валиден файл с изображение." : "Choose a valid image file.");
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
      setFormData((current) => ({ ...current, imageURI: data.url }));
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
      void uploadImage(image);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isModalOpen, uploading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...(editingCategory ? { id: editingCategory.id } : {}),
          name: formData.name.trim(),
          imageURI: formData.imageURI.trim() || null,
        }),
      });
      await readApiJson(response);
      await fetchCategories();
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Категорията не можа да бъде запазена." : "The category could not be saved.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/Categories/${categoryToDelete.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await readApiJson(response);
      setSelectedCategoryIds((previous) => previous.filter((id) => id !== categoryToDelete.id));
      await fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Категорията не можа да бъде изтрита." : "The category could not be deleted.");
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!selectedCategoryIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        selectedCategoryIds.map(async (categoryId) => {
          const response = await fetch(`${API_BASE_URL}/Categories/${categoryId}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          await readApiJson(response);
          return categoryId;
        })
      );

      const deletedIds = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map((result) => result.value);
      const failedCount = results.length - deletedIds.length;

      setSelectedCategoryIds((previous) => previous.filter((id) => !deletedIds.includes(id)));
      await fetchCategories();
      setIsBulkDeleteModalOpen(false);

      if (failedCount > 0) {
        setError(
          isBg
            ? `${failedCount} категории не можаха да бъдат изтрити. Възможно е да съдържат продукти.`
            : `${failedCount} categories could not be deleted. They may contain products.`
        );
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
        <button type="button" onClick={handleAddCategory} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition-colors hover:bg-[#149f8a]">
          <PlusIcon className="mr-2 h-5 w-5" />{text.add}
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">{isBg ? "Филтри" : "Filters"}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.7fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] xl:items-end">
          <div>
            <label htmlFor="categorySearch" className="mb-1 block text-xs font-medium text-gray-600">{text.search}</label>
            <input id="categorySearch" type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder={text.searchPlaceholder} className="block min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20" />
          </div>
          <div>
            <label htmlFor="productFilter" className="mb-1 block text-xs font-medium text-gray-600">{text.filterProducts}</label>
            <select id="productFilter" value={productFilter} onChange={(event) => { setProductFilter(event.target.value as ProductFilter); setCurrentPage(1); }} className="block min-h-10 w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm">
              <option value="all">{text.all}</option>
              <option value="withProducts">{text.withProducts}</option>
              <option value="empty">{text.empty}</option>
            </select>
          </div>
          <div>
            <label htmlFor="imageFilter" className="mb-1 block text-xs font-medium text-gray-600">{text.filterImages}</label>
            <select id="imageFilter" value={imageFilter} onChange={(event) => { setImageFilter(event.target.value as ImageFilter); setCurrentPage(1); }} className="block min-h-10 w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm">
              <option value="all">{text.all}</option>
              <option value="withImage">{text.withImage}</option>
              <option value="withoutImage">{text.withoutImage}</option>
            </select>
          </div>
          <button type="button" onClick={clearFilters} disabled={!hasActiveFilters} className="min-h-10 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">{text.clear}</button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex items-center gap-2">
            <label htmlFor="categorySort" className="whitespace-nowrap text-sm text-gray-700">{text.sortBy}</label>
            <select id="categorySort" value={sortBy} onChange={(event) => { setSortBy(event.target.value as CategorySort); setCurrentPage(1); }} className="block w-40 rounded-md border-gray-300 shadow-sm sm:text-sm">
              <option value="name">{text.name}</option>
              <option value="productCount">{text.products}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="categoryOrder" className="text-sm text-gray-700">{text.order}</label>
            <select id="categoryOrder" value={sortDescending ? "desc" : "asc"} onChange={(event) => { setSortDescending(event.target.value === "desc"); setCurrentPage(1); }} className="block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm">
              <option value="asc">{text.ascending}</option>
              <option value="desc">{text.descending}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="categoryPageSize" className="whitespace-nowrap text-sm text-gray-700">{text.perPage}</label>
            <select id="categoryPageSize" value={itemsPerPage} onChange={(event) => handleItemsPerPageChange(Number(event.target.value))} className="block w-20 rounded-md border-gray-300 shadow-sm sm:text-sm">
              {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button type="button" onClick={() => setSelectedCategoryIds([])} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">{text.clearSelection}</button>
            <button type="button" onClick={() => setIsBulkDeleteModalOpen(true)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              <TrashIcon className="mr-2 h-5 w-5" />{text.deleteSelected} ({selectedCategoryIds.length})
            </button>
          </div>
        )}
      </div>

      {filteredAndSortedCategories.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500 shadow-sm">{text.noResults}</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {paginatedCategories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);
              return (
                <article key={category.id} className={`rounded-xl border p-3 shadow-sm ${selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={selected} onChange={() => toggleCategorySelection(category.id)} className="h-5 w-5 rounded border-gray-300 accent-[#18b99f]" />
                      {text.select}
                    </label>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{text.products}: {category.productCount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => handleEditCategory(category)} className="h-16 w-16 flex-none overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {category.imageURI ? <img src={category.imageURI} alt={category.name} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-slate-400">{text.noImage}</span>}
                    </button>
                    <button type="button" onClick={() => handleEditCategory(category)} className="min-w-0 flex-1 text-left font-semibold text-slate-950 hover:underline">{category.name}</button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEditCategory(category)} className="rounded-md bg-yellow-600 p-2 text-white" title={text.edit}><PencilIcon className="h-5 w-5" /></button>
                      <button type="button" onClick={() => { setCategoryToDelete(category); setIsDeleteModalOpen(true); }} className="rounded-md bg-red-600 p-2 text-white" title={text.delete}><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-lg bg-white shadow lg:block">
            <div className="table-scroll">
              <table className="w-full min-w-[46rem] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-28 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap">
                        <input type="checkbox" checked={allPageSelected} onChange={toggleAllCategoriesOnPage} className="h-5 w-5 rounded border-gray-300 accent-[#18b99f]" />
                        <span>{text.select}</span>
                      </label>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{text.name}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{text.products}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedCategories.map((category) => {
                    const selected = selectedCategoryIds.includes(category.id);
                    return (
                      <tr key={category.id} className={selected ? "bg-emerald-50" : ""}>
                        <td className="px-4 py-4 align-middle">
                          <input type="checkbox" checked={selected} onChange={() => toggleCategorySelection(category.id)} aria-label={`${text.select} ${category.name}`} className="h-5 w-5 rounded border-gray-300 accent-[#18b99f]" />
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => handleEditCategory(category)} className="flex-none rounded-md focus:outline-none focus:ring-2 focus:ring-[#18b99f] focus:ring-offset-2">
                              <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-gray-100">{category.imageURI ? <img src={category.imageURI} alt={category.name} className="h-full w-full object-cover" /> : null}</div>
                            </button>
                            <button type="button" onClick={() => handleEditCategory(category)} className="text-left font-medium hover:underline">{category.name}</button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{category.productCount}</td>
                        <td className="px-6 py-4 text-right">
                          <button type="button" onClick={() => handleEditCategory(category)} className="mr-2 rounded-md bg-yellow-600 p-1.5 text-white hover:bg-yellow-700" title={text.edit}><PencilIcon className="h-5 w-5" /></button>
                          <button type="button" onClick={() => { setCategoryToDelete(category); setIsDeleteModalOpen(true); }} className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700" title={text.delete}><TrashIcon className="h-5 w-5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-md bg-[#18b99f] p-2 text-white disabled:cursor-not-allowed disabled:bg-gray-200"><ChevronLeftIcon className="h-5 w-5" /></button>
            <span className="text-gray-700">{text.page} {currentPage} {text.of} {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-md bg-[#18b99f] p-2 text-white disabled:cursor-not-allowed disabled:bg-gray-200"><ChevronRightIcon className="h-5 w-5" /></button>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeEditModal()}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 text-gray-900 sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{editingCategory ? text.edit : text.add}</h2><button type="button" onClick={closeEditModal} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={text.cancel}><XMarkIcon className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div><label className="mb-1 block text-sm font-medium text-gray-700">{text.name}</label><input type="text" value={formData.name} onChange={(event) => { setFormData((current) => ({ ...current, name: event.target.value })); setValidationErrors({}); }} className={`block min-h-11 w-full rounded-md border bg-white px-3 py-2 text-gray-900 shadow-sm ${validationErrors.name ? "border-red-400" : "border-slate-400"}`} />{validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}</div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{text.image}</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} />
                <div role="button" tabIndex={0} onClick={() => !uploading && fileInputRef.current?.click()} onKeyDown={(event) => { if (!uploading && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); fileInputRef.current?.click(); } }} onDragEnter={(event) => { event.preventDefault(); if (!uploading) setDropActive(true); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; if (!uploading) setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={(event) => { event.preventDefault(); setDropActive(false); if (uploading) return; const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/")); if (file) void uploadImage(file); }} className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${dropActive ? "border-[#18b99f] bg-emerald-50 ring-2 ring-[#18b99f]/20" : "border-slate-300 bg-slate-50 hover:border-[#18b99f]"} ${uploading ? "opacity-60" : ""}`}><div className="text-sm font-semibold">{uploading ? text.uploading : dropActive ? text.drop : text.choose}</div><div className="mt-1 text-xs text-slate-500">{text.help}</div></div>

                {formData.imageURI && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setFullImageUrl(formData.imageURI)} className="block w-full cursor-zoom-in bg-slate-100" title={text.full}><img src={formData.imageURI} alt={formData.name || text.image} className="aspect-[16/8] w-full object-cover" /></button>
                    <button type="button" onClick={() => setFormData((current) => ({ ...current, imageURI: "" }))} className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4" />{text.remove}</button>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={closeEditModal} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">{text.cancel}</button><button type="submit" disabled={uploading} className="rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a] disabled:opacity-50">{editingCategory ? text.save : text.add}</button></div>
            </form>
          </div>
        </div>
      )}

      {fullImageUrl && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onMouseDown={(event) => event.target === event.currentTarget && setFullImageUrl(null)}><img src={fullImageUrl} alt={formData.name || text.image} className="max-h-[95vh] max-w-[95vw] object-contain" /></div>}

      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsDeleteModalOpen(false); setCategoryToDelete(null); } }}>
          <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold text-gray-900">{text.deleteTitle}</h2><p className="mb-6 text-gray-600">{isBg ? `Да се изтрие ли категорията „${categoryToDelete.name}“?` : `Delete category “${categoryToDelete.name}”?`}</p><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setIsDeleteModalOpen(false); setCategoryToDelete(null); }} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">{text.cancel}</button><button type="button" onClick={() => void handleDeleteConfirm()} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">{text.delete}</button></div></div>
        </div>
      )}

      {isBulkDeleteModalOpen && selectedCategoryIds.length > 0 && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !bulkDeleting) setIsBulkDeleteModalOpen(false); }}>
          <div className="w-full max-w-lg rounded-xl bg-white p-5 text-gray-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{text.bulkDeleteTitle}</h2>
                <p className="mt-1 text-sm text-gray-600">{isBg ? `Избрани: ${selectedCategoryIds.length}` : `Selected: ${selectedCategoryIds.length}`}</p>
              </div>
              <button type="button" disabled={bulkDeleting} onClick={() => setIsBulkDeleteModalOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {selectedCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 border-b border-slate-200 py-2 text-sm last:border-b-0">
                  <span className="font-medium text-slate-800">{category.name}</span>
                  <span className="whitespace-nowrap text-xs text-slate-500">{text.products}: {category.productCount}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-red-700">{isBg ? "Категории, които съдържат продукти, може да не могат да бъдат изтрити." : "Categories containing products may not be deletable."}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={bulkDeleting} onClick={() => setIsBulkDeleteModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{text.cancel}</button>
              <button type="button" disabled={bulkDeleting} onClick={() => void handleBulkDeleteConfirm()} className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                <TrashIcon className="mr-2 h-5 w-5" />{bulkDeleting ? (isBg ? "Изтриване..." : "Deleting...") : `${text.deleteSelected} (${selectedCategoryIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;