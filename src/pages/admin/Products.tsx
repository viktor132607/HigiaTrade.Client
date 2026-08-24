import React, { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RootState } from "../../store";
import { formatCurrency } from "../../utils/currency";
import ProductPricingAndUploadFields from "../../components/admin/ProductPricingAndUploadFields";

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id?: string | null;
  uri: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  regularPrice: number;
  quantity: number;
  imageUrl?: string;
  rating: number;
  discountPercentage: number;
  discountedPrice: number;
  wholesalePrice?: number;
  wholesalePriceInclVat?: number;
  vatRate?: number;
  isActive?: boolean;
  mainImageUrl: string;
  secondaryImages: ProductImage[];
}

interface FormData {
  name: string;
  description: string;
  categoryId: string;
  regularPrice: string;
  discountedPrice: string;
  stock: string;
  discountPercentage: string;
  mainImageUrl: string;
  secondaryImages: ProductImage[];
  isActive: boolean;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  categoryId?: string;
  regularPrice?: string;
  discountedPrice?: string;
  stock?: string;
  discountPercentage?: string;
  mainImageUrl?: string;
  secondaryImages?: string[];
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "adminProductsItemsPerPage";

const emptyForm = (): FormData => ({
  name: "",
  description: "",
  categoryId: "",
  regularPrice: "",
  discountedPrice: "",
  stock: "",
  discountPercentage: "0",
  mainImageUrl: "",
  secondaryImages: [{ uri: "" }],
  isActive: true,
});

const getInitialPageSize = () => {
  if (typeof window === "undefined") return PAGE_SIZE_OPTIONS[0];

  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(saved) ? saved : PAGE_SIZE_OPTIONS[0];
};

const AdminProducts = () => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialPageSize);
  const [sortBy, setSortBy] = useState("title");
  const [sortDescending, setSortDescending] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setDebouncedMinPrice(minPrice.trim());
      setDebouncedMaxPrice(maxPrice.trim());
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, minPrice, maxPrice]);

  useEffect(() => {
    void fetchProducts();
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    sortDescending,
    selectedCategoryId,
    debouncedSearchTerm,
    debouncedMinPrice,
    debouncedMaxPrice,
  ]);

  const filteredFormCategories = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase("bg-BG");
    if (!query) return categories;

    return categories.filter((category) =>
      category.name.toLocaleLowerCase("bg-BG").includes(query)
    );
  }, [categories, categorySearch]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) throw new Error("Категориите не можаха да бъдат заредени.");
      setCategories(await response.json());
    } catch (error) {
      console.error("Грешка при зареждане на категориите:", error);
      toast.error("Категориите не можаха да бъдат заредени.");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
      });

      if (selectedCategoryId) query.set("CategoryId", selectedCategoryId);
      if (debouncedSearchTerm) query.set("Title", debouncedSearchTerm);
      if (debouncedMinPrice) query.set("MinPrice", debouncedMinPrice);
      if (debouncedMaxPrice) query.set("MaxPrice", debouncedMaxPrice);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      if (!response.ok) throw new Error("Продуктите не можаха да бъдат заредени.");

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const totalCount = Number(data.totalCount ?? items.length);

      setProducts(items);
      setSelectedProductIds([]);
      setTotalPages(Math.max(1, Math.ceil(totalCount / itemsPerPage)));
    } catch (error) {
      console.error("Грешка при зареждане на продуктите:", error);
      toast.error("Продуктите не можаха да бъдат заредени.");
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setCategorySearch("");
    setValidationErrors({});
    setEditingProduct(null);
    setIsCategoryMenuOpen(false);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleAddProduct = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    const category = categories.find((item) => item.id === product.categoryId);

    setEditingProduct(product);
    setFormData({
      name: product.title || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      regularPrice: (product.regularPrice || 0).toString(),
      discountedPrice: (product.discountedPrice || 0).toString(),
      stock: (product.quantity || 0).toString(),
      discountPercentage: (product.discountPercentage || 0).toString(),
      mainImageUrl: product.mainImageUrl || "",
      secondaryImages:
        product.secondaryImages?.length > 0 ? product.secondaryImages : [{ uri: "" }],
      isActive: product.isActive !== false,
    });
    setCategorySearch(category?.name || product.categoryName || "");
    setValidationErrors({});
    setIsCategoryMenuOpen(false);
    setIsModalOpen(true);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCategorySearchChange = (value: string) => {
    setCategorySearch(value);
    setFormData((previous) => ({ ...previous, categoryId: "" }));
    setValidationErrors((previous) => ({ ...previous, categoryId: undefined }));
    setIsCategoryMenuOpen(true);
  };

  const selectCategory = (category: Category) => {
    setCategorySearch(category.name);
    setFormData((previous) => ({ ...previous, categoryId: category.id }));
    setValidationErrors((previous) => ({ ...previous, categoryId: undefined }));
    setIsCategoryMenuOpen(false);
  };

  const handleSecondaryImageChange = (index: number, value: string) => {
    setFormData((previous) => ({
      ...previous,
      secondaryImages: previous.secondaryImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, uri: value } : image
      ),
    }));
  };

  const addSecondaryImageField = () => {
    setFormData((previous) => ({
      ...previous,
      secondaryImages: [...previous.secondaryImages, { uri: "" }],
    }));
  };

  const removeSecondaryImageField = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      secondaryImages: previous.secondaryImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (formData.name.trim().length < 3) errors.name = "Използвай поне 3 символа.";
    if (formData.description.trim().length < 3) errors.description = "Използвай поне 3 символа.";
    if (!formData.categoryId) errors.categoryId = "Избери категория от резултатите.";

    const regularPrice = Number.parseFloat(formData.regularPrice);
    if (!formData.regularPrice || Number.isNaN(regularPrice) || regularPrice < 0) {
      errors.regularPrice = "Въведи валидна цена.";
    }

    if (formData.discountedPrice) {
      const discountedPrice = Number.parseFloat(formData.discountedPrice);
      if (Number.isNaN(discountedPrice) || discountedPrice < 0) {
        errors.discountedPrice = "Въведи валидна промоционална цена.";
      }
    }

    const stock = Number.parseInt(formData.stock, 10);
    if (!formData.stock || Number.isNaN(stock) || stock < 0) {
      errors.stock = "Въведи валидна наличност.";
    }

    const discount = Number.parseFloat(formData.discountPercentage);
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      errors.discountPercentage = "Отстъпката трябва да е между 0 и 100%.";
    }

    if (!formData.mainImageUrl.trim()) {
      errors.mainImageUrl = "Основното изображение е задължително.";
    } else {
      try {
        new URL(formData.mainImageUrl);
      } catch {
        errors.mainImageUrl = "Въведи валиден URL адрес.";
      }
    }

    formData.secondaryImages.forEach((image, index) => {
      if (!image.uri.trim()) return;
      try {
        new URL(image.uri);
      } catch {
        errors.secondaryImages ??= [];
        errors.secondaryImages[index] = "Невалиден URL.";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    const submittedFields = new window.FormData(event.currentTarget);
    const retailPriceRaw = String(submittedFields.get("retailPrice") ?? "").trim();
    const wholesalePriceRaw = String(submittedFields.get("wholesalePrice") ?? "").trim();
    const vatRateRaw = String(submittedFields.get("vatRate") ?? "20").trim();

    const retailPrice = retailPriceRaw
      ? Math.max(0, Number.parseFloat(retailPriceRaw) || 0)
      : Number.parseFloat(formData.regularPrice) || 0;
    const wholesalePrice = wholesalePriceRaw
      ? Math.max(0, Number.parseFloat(wholesalePriceRaw) || 0)
      : 0;
    const vatRate = Math.min(100, Math.max(0, Number.parseFloat(vatRateRaw) || 20));

    const isEditing = Boolean(editingProduct);
    const payload = {
      ...(isEditing && { id: editingProduct?.id }),
      title: formData.name.trim(),
      description: formData.description,
      mainImageUrl: formData.mainImageUrl.trim(),
      isActive: formData.isActive,
      regularPrice: retailPrice,
      wholesalePrice,
      wholesaleMinQuantity: wholesalePrice > 0 ? 2 : 0,
      vatRate,
      discountPercentage: Number.parseFloat(formData.discountPercentage) || 0,
      discountedPrice: Number.parseFloat(formData.discountedPrice) || 0,
      quantity: Number.parseInt(formData.stock, 10) || 0,
      categoryId: formData.categoryId,
      secondaryImages: formData.secondaryImages
        .filter((image) => image.uri.trim())
        .map((image) => ({ id: image.id, uri: image.uri.trim() })),
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Продуктът не можа да бъде запазен.");
      }

      await fetchProducts();
      closeEditModal();
      toast.success(isEditing ? "Продуктът е обновен." : "Продуктът е добавен.");
    } catch (error) {
      console.error("Грешка при запазване на продукта:", error);
      toast.error(error instanceof Error ? error.message : "Продуктът не можа да бъде запазен.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Products/${productToDelete.id}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (!response.ok) throw new Error("Продуктът не можа да бъде изтрит.");

      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Продуктът не можа да бъде изтрит.");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    );
  };

  const toggleAllProductsOnPage = () => {
    const ids = products.map((product) => product.id);
    const allSelected = ids.every((id) => selectedProductIds.includes(id));

    setSelectedProductIds((previous) =>
      allSelected
        ? previous.filter((id) => !ids.includes(id))
        : Array.from(new Set([...previous, ...ids]))
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    if (!window.confirm(`Да се изтрият ли избраните ${selectedProductIds.length} продукта?`)) return;

    try {
      await Promise.all(
        selectedProductIds.map(async (productId) => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!response.ok) throw new Error("Един или повече продукти не можаха да бъдат изтрити.");
        })
      );

      setSelectedProductIds([]);
      await fetchProducts();
      toast.success("Избраните продукти са изтрити.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Избраните продукти не можаха да бъдат изтрити.");
    }
  };

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, size.toString());
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setDebouncedSearchTerm("");
    setDebouncedMinPrice("");
    setDebouncedMaxPrice("");
    setSelectedCategoryId("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || selectedCategoryId || minPrice || maxPrice);
  const regularInputClass =
    "mt-1 block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20";

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Управление на продукти</h1>
          <button
            type="button"
            onClick={handleAddProduct}
            className="flex items-center justify-center rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a]"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Добави продукт
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-gray-900">Филтри</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_minmax(220px,1.5fr)_120px_120px_auto] xl:items-end">
            <div>
              <label htmlFor="productSearch" className="mb-1 block text-xs font-medium text-gray-600">Търси по име</label>
              <input
                id="productSearch"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Напр. Sano Floor Plus"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="categoryFilter" className="mb-1 block text-xs font-medium text-gray-600">Категория</label>
              <select
                id="categoryFilter"
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(event.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Всички категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="minPrice" className="mb-1 block text-xs font-medium text-gray-600">Цена от</label>
              <input id="minPrice" type="number" min="0" step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium text-gray-600">Цена до</label>
              <input id="maxPrice" type="number" min="0" step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Макс." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <button type="button" onClick={clearFilters} disabled={!hasActiveFilters} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Изчисти</button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-700">Сортиране по:</label>
              <select id="sortBy" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1); }} className="block w-32 rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="title">Име</option>
                <option value="regularPrice">Цена</option>
                <option value="quantity">Наличност</option>
                <option value="rating">Рейтинг</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sortOrder" className="text-sm text-gray-700">Ред:</label>
              <select id="sortOrder" value={sortDescending ? "desc" : "asc"} onChange={(event) => { setSortDescending(event.target.value === "desc"); setCurrentPage(1); }} className="block w-28 rounded-md border-gray-300 shadow-sm sm:text-sm">
                <option value="desc">Низходящ</option>
                <option value="asc">Възходящ</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">На страница:</label>
              <select id="itemsPerPage" value={itemsPerPage} onChange={(event) => handleItemsPerPageChange(Number(event.target.value))} className="block w-20 rounded-md border-gray-300 shadow-sm sm:text-sm">
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          </div>

          {selectedProductIds.length > 0 && (
            <button type="button" onClick={handleBulkDelete} className="flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              <TrashIcon className="mr-2 h-5 w-5" />
              Изтрий избраните ({selectedProductIds.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" /></div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Няма продукти за показване.</div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="table-scroll">
                <table className="w-full min-w-[56rem] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left"><input type="checkbox" checked={products.length > 0 && products.every((product) => selectedProductIds.includes(product.id))} onChange={toggleAllProductsOnPage} className="h-4 w-4 rounded border-gray-300" /></th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Име</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Категория</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Цена (EUR)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Отстъпка</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Наличност</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {products.map((product) => {
                      const thumbnailUrl = product.mainImageUrl || product.imageUrl;
                      return (
                        <tr key={product.id} className={product.isActive === false ? "bg-gray-50 opacity-65" : ""}>
                          <td className="px-6 py-4"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="h-4 w-4 rounded border-gray-300" /></td>
                          <td className="px-6 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => handleEditProduct(product)} className="flex-none rounded-md focus:outline-none focus:ring-2 focus:ring-[#18b99f] focus:ring-offset-2" title="Редактирай продукт">
                                {thumbnailUrl ? <img src={thumbnailUrl} alt={product.title || "Продукт"} className="h-12 w-12 rounded-md border border-gray-300 object-cover" /> : <div className="h-12 w-12 rounded-md border border-gray-300 bg-gray-100" />}
                              </button>
                              <button type="button" onClick={() => handleEditProduct(product)} className="text-left hover:underline">{product.title || ""}</button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{categories.find((category) => category.id === product.categoryId)?.name || product.categoryName || "Без категория"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.discountedPrice || product.regularPrice || 0)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.discountPercentage ? `${product.discountPercentage}%` : "0%"}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{product.quantity || 0}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button type="button" onClick={() => handleEditProduct(product)} className="mr-2 rounded-md bg-yellow-600 p-1.5 text-white hover:bg-yellow-700" title="Редактирай"><PencilIcon className="h-5 w-5" /></button>
                            <button type="button" onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }} className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700" title="Изтрий"><TrashIcon className="h-5 w-5" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-md bg-primary-500 p-2 text-white disabled:cursor-not-allowed disabled:bg-gray-200"><ChevronLeftIcon className="h-5 w-5" /></button>
              <span className="text-gray-700">Страница {currentPage} от {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-md bg-primary-500 p-2 text-white disabled:cursor-not-allowed disabled:bg-gray-200"><ChevronRightIcon className="h-5 w-5" /></button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-2 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <div className="my-2 max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-4 text-gray-900 shadow-2xl sm:my-0 sm:p-7">
            <h2 className="mb-5 text-xl font-bold">{editingProduct ? "Редактирай продукт" : "Добави продукт"}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Име</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${regularInputClass} border-2 border-slate-600`}
                />
                {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800">Категория</label>
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(event) => handleCategorySearchChange(event.target.value)}
                  onFocus={() => setIsCategoryMenuOpen(true)}
                  onBlur={() => window.setTimeout(() => setIsCategoryMenuOpen(false), 120)}
                  placeholder="Започни да пишеш категория..."
                  autoComplete="off"
                  className={`${regularInputClass} ${validationErrors.categoryId ? "border-red-500" : ""}`}
                />
                {isCategoryMenuOpen && (
                  <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-500 bg-white shadow-xl">
                    {filteredFormCategories.length ? (
                      filteredFormCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectCategory(category)}
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${formData.categoryId === category.id ? "bg-emerald-50 font-semibold text-emerald-800" : "text-gray-900"}`}
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">Няма намерени категории.</div>
                    )}
                  </div>
                )}
                {validationErrors.categoryId && <p className="mt-1 text-sm text-red-600">{validationErrors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Статус</label>
                <button
                  type="button"
                  onClick={() => setFormData((previous) => ({ ...previous, isActive: !previous.isActive }))}
                  className={`mt-1 inline-flex min-w-36 items-center justify-center rounded-md px-4 py-2 font-semibold text-white ${formData.isActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-500 hover:bg-slate-600"}`}
                >
                  {formData.isActive ? "Активен" : "Неактивен"}
                </button>
                <p className="mt-1 text-xs text-gray-500">{formData.isActive ? "Продуктът се показва в магазина." : "Продуктът остава в админ панела, но е скрит от магазина."}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                  className={`${regularInputClass} min-h-44 resize-y`}
                />
                {validationErrors.description && <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Редовна цена (EUR)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" name="regularPrice" value={formData.regularPrice} onChange={handleInputChange} className={regularInputClass} />
                {validationErrors.regularPrice && <p className="mt-1 text-sm text-red-600">{validationErrors.regularPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Промоционална цена (EUR)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" name="discountedPrice" value={formData.discountedPrice} onChange={handleInputChange} className={regularInputClass} />
                {validationErrors.discountedPrice && <p className="mt-1 text-sm text-red-600">{validationErrors.discountedPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Наличност</label>
                <input type="number" inputMode="numeric" min="0" name="stock" value={formData.stock} onChange={handleInputChange} className={regularInputClass} />
                {validationErrors.stock && <p className="mt-1 text-sm text-red-600">{validationErrors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Отстъпка (%)</label>
                <input type="number" min="0" max="100" name="discountPercentage" value={formData.discountPercentage} onChange={handleInputChange} className={regularInputClass} />
                {validationErrors.discountPercentage && <p className="mt-1 text-sm text-red-600">{validationErrors.discountPercentage}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">URL на основното изображение</label>
                <input type="url" name="mainImageUrl" value={formData.mainImageUrl} onChange={handleInputChange} className={regularInputClass} />
                {validationErrors.mainImageUrl && <p className="mt-1 text-sm text-red-600">{validationErrors.mainImageUrl}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-gray-800">URL адреси на допълнителни изображения</label>
                  <button type="button" onClick={addSecondaryImageField} className="rounded-md bg-[#18b99f] px-3 py-1.5 text-sm text-white hover:bg-[#149f8a]">+ Добави изображение</button>
                </div>
                {formData.secondaryImages.map((image, index) => (
                  <div key={index} className="mb-2 flex gap-2">
                    <input type="url" value={image.uri} onChange={(event) => handleSecondaryImageChange(index, event.target.value)} placeholder="URL на допълнително изображение" className={`${regularInputClass} mt-0 flex-1`} />
                    {formData.secondaryImages.length > 1 && (
                      <button type="button" onClick={() => removeSecondaryImageField(index)} className="rounded-md bg-red-600 px-3 text-white hover:bg-red-700" title="Премахни"><TrashIcon className="h-5 w-5" /></button>
                    )}
                  </div>
                ))}
                {validationErrors.secondaryImages?.some(Boolean) && <p className="mt-1 text-sm text-red-600">Има невалиден URL адрес на изображение.</p>}
              </div>

              <div className="space-y-5 rounded-lg border border-slate-300 bg-slate-50/50 p-4">
                <ProductPricingAndUploadFields
                  key={editingProduct?.id ?? "new-product"}
                  token={token}
                  regularPrice={formData.regularPrice}
                  defaultRetailPrice={editingProduct?.regularPrice}
                  defaultWholesalePrice={editingProduct?.wholesalePriceInclVat ?? editingProduct?.wholesalePrice}
                  currentMainImageUrl={formData.mainImageUrl}
                  currentSecondaryImages={formData.secondaryImages}
                  onImagesChange={(mainImageUrl, secondaryImages) => {
                    setFormData((previous) => ({ ...previous, mainImageUrl, secondaryImages }));
                    setValidationErrors((previous) => ({ ...previous, mainImageUrl: undefined, secondaryImages: undefined }));
                  }}
                />
              </div>

              <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:-mx-7 sm:flex-row sm:justify-end sm:px-7">
                <button type="button" onClick={closeEditModal} className="rounded-md border border-slate-400 px-4 py-2 text-gray-700 hover:bg-gray-50">Отказ</button>
                <button type="submit" className="rounded-md bg-[#18b99f] px-5 py-2 font-semibold text-white hover:bg-[#149f8a]">{editingProduct ? "Запази" : "Добави"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsDeleteModalOpen(false); setProductToDelete(null); } }}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Изтриване на продукт</h2>
            <p className="mb-6 text-gray-600">Да се изтрие ли продуктът „{productToDelete.title}“?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Отказ</button>
              <button type="button" onClick={handleDeleteConfirm} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">Изтрий</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
