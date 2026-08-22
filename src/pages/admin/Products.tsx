import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../../utils/currency";
import ProductPricingAndUploadFields from "../../components/admin/ProductPricingAndUploadFields";


interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  regularPrice: number;
  quantity: number;
  imageUrl: string;
  rating: number;
  discountPercentage: number;
  discountedPrice: number;
  wholesalePrice?: number;
  wholesalePriceInclVat?: number;
  vatRate?: number;
  reviews: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  mainImageUrl: string;
  secondaryImages: Array<{ id?: string | null; uri: string }>;
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
  secondaryImages: { id?: string | null; uri: string }[];
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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const AdminProducts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [sortBy, setSortBy] = useState("title");
  const [sortDescending, setSortDescending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    categoryId: "",
    regularPrice: "",
    discountedPrice: "",
    stock: "",
    discountPercentage: "0",
    mainImageUrl: "",
    secondaryImages: [{ uri: "" }],
  });
  const { token } = useSelector((state: RootState) => state.auth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, itemsPerPage, sortBy, sortDescending]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("We could not load categories.");
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
      toast.error("We could not load categories.");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Products?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("We could not load products.");
      }

      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        setProducts(data.items);
        setSelectedProductIds([]);
        if (data.totalCount) {
          setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
        }
      } else {
        setProducts([]);
        setSelectedProductIds([]);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      toast.error("We could not load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };

  const handleSecondaryImageChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      secondaryImages: prev.secondaryImages.map((img, i) =>
        i === index ? { ...img, uri: value } : img
      ),
    }));
  };

  const addSecondaryImageField = () => {
    setFormData((prev) => ({
      ...prev,
      secondaryImages: [...prev.secondaryImages, { uri: "" }],
    }));
  };

  const removeSecondaryImageField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      secondaryImages: prev.secondaryImages.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required.";
    } else if (formData.name.length < 3) {
      errors.name = "Use at least 3 characters.";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required.";
    } else if (formData.description.length < 3) {
      errors.description = "Use at least 3 characters.";
    }

    if (!formData.categoryId) {
      errors.categoryId = "Choose a category.";
    }

    const regularPriceNum = parseFloat(formData.regularPrice);
    if (!formData.regularPrice) {
      errors.regularPrice = "Regular price is required.";
    } else if (isNaN(regularPriceNum)) {
      errors.regularPrice = "Enter a valid price.";
    } else if (regularPriceNum < 0) {
      errors.regularPrice = "Price cannot be negative.";
    } else if (regularPriceNum > 100000) {
      errors.regularPrice = "Price cannot exceed 100,000.";
    }

    const stockNum = parseInt(formData.stock);
    if (!formData.stock) {
      errors.stock = "Stock quantity is required.";
    } else if (isNaN(stockNum)) {
      errors.stock = "Enter a valid quantity.";
    } else if (stockNum < 0) {
      errors.stock = "Quantity cannot be negative.";
    } else if (stockNum > 10000) {
      errors.stock = "Quantity cannot exceed 10,000.";
    }

    if (!formData.mainImageUrl.trim()) {
      errors.mainImageUrl = "Main image URL is required.";
    } else {
      try {
        new URL(formData.mainImageUrl);
      } catch {
        errors.mainImageUrl = "Enter a valid URL.";
      }
    }

    formData.secondaryImages.forEach((img, index) => {
      if (img.uri.trim()) {
        try {
          new URL(img.uri);
        } catch {
          if (!errors.secondaryImages) {
            errors.secondaryImages = [];
          }
          errors.secondaryImages[index] = "Enter a valid URL.";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submittedFields = new window.FormData(e.currentTarget);
    const retailPriceRaw = String(submittedFields.get("retailPrice") ?? "").trim();
    const wholesalePriceRaw = String(submittedFields.get("wholesalePrice") ?? "").trim();
    const vatRateRaw = String(submittedFields.get("vatRate") ?? "20").trim();

    const retailPrice =
      retailPriceRaw === ""
        ? parseFloat(formData.regularPrice) || 0
        : Math.max(0, parseFloat(retailPriceRaw) || 0);
    const wholesalePrice =
      wholesalePriceRaw === ""
        ? 0
        : Math.max(0, parseFloat(wholesalePriceRaw) || 0);
    const vatRate = Math.min(100, Math.max(0, parseFloat(vatRateRaw) || 20));

    try {
      const isEditing = !!editingProduct;

      const submitData = {
        ...(isEditing && { id: editingProduct.id }),
        title: formData.name,
        description: formData.description,
        mainImageUrl: formData.mainImageUrl,
        regularPrice: retailPrice,
        wholesalePrice,
        wholesaleMinQuantity: wholesalePrice > 0 ? 2 : 0,
        vatRate,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        discountedPrice: parseFloat(formData.discountedPrice) || 0,
        quantity: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId,
        secondaryImages: formData.secondaryImages
          .filter((img) => img.uri.trim() !== "")
          .map((img, index) => {
            if (isEditing && editingProduct?.secondaryImages[index]) {
              return {
                id: editingProduct.secondaryImages[index].id,
                uri: img.uri,
              };
            }

            return {
              uri: img.uri,
            };
          }),
      };

      const url = `${process.env.NEXT_PUBLIC_API_URL}/Products`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "We could not save the product.");
      }

      await fetchProducts();
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        regularPrice: "",
        discountedPrice: "",
        stock: "",
        discountPercentage: "0",
        mainImageUrl: "",
        secondaryImages: [{ uri: "" }],
      });
      setValidationErrors({});
      setEditingProduct(null);
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(
        err instanceof Error ? err.message : "We could not save the product."
      );
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      regularPrice: "",
      discountedPrice: "",
      stock: "",
      discountPercentage: "0",
      mainImageUrl: "",
      secondaryImages: [{ uri: "" }],
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
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
        product.secondaryImages && product.secondaryImages.length > 0
          ? product.secondaryImages
          : [{ uri: "" }],
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Products/${productToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "We could not delete the product."
        );
      }

      await fetchProducts();
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(
        err instanceof Error ? err.message : "We could not delete the product."
      );
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
    const currentPageProductIds = products.map((product) => product.id);
    const allSelected = currentPageProductIds.every((id) =>
      selectedProductIds.includes(id)
    );

    setSelectedProductIds((previous) => {
      if (allSelected) {
        return previous.filter((id) => !currentPageProductIds.includes(id));
      }

      return Array.from(new Set([...previous, ...currentPageProductIds]));
    });
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedProductIds.length} selected product${
        selectedProductIds.length === 1 ? "" : "s"
      }?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        selectedProductIds.map(async (productId) => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("We could not delete one or more products.");
          }
        })
      );

      toast.success("Selected products deleted.");
      setSelectedProductIds([]);
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting selected products:", err);
      toast.error(
        err instanceof Error ? err.message : "We could not delete selected products."
      );
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage products</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-700">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="title">Name</option>
                <option value="regularPrice">Price</option>
                <option value="quantity">Stock</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="sortOrder" className="text-sm text-gray-700">
                Order:
              </label>
              <select
                id="sortOrder"
                value={sortDescending ? "desc" : "asc"}
                onChange={(e) => setSortDescending(e.target.value === "desc")}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Per page:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            {selectedProductIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete selected ({selectedProductIds.length})
              </button>
            )}
            <button
              onClick={handleAddProduct}
              className="flex items-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition hover:bg-[#149f8a]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add product
            </button>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : !loading && products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products to show.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="table-scroll">
                <table className="min-w-[56rem] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={
                            products.length > 0 &&
                            products.every((product) =>
                              selectedProductIds.includes(product.id)
                            )
                          }
                          onChange={toggleAllProductsOnPage}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (EUR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.title || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {categories.find((c) => c.id === product.categoryId)
                            ?.name || "Uncategorized"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(
                            product.discountedPrice ||
                              product.regularPrice ||
                              0
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.discountPercentage
                            ? `${product.discountPercentage}%`
                            : "0%"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-white bg-yellow-600 hover:bg-yellow-700 p-1.5 rounded-md mr-2"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded-md"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md text-white ${
                  currentPage === 1
                    ? "bg-gray-200 cursor-not-allowed hover:bg-gray-200"
                    : "bg-primary-500 hover:bg-primary-600"
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-200 cursor-not-allowed hover:bg-gray-200"
                    : "bg-primary-500 hover:bg-primary-600"
                } text-white`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {editingProduct ? "Edit product" : "Add product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.name
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.categoryId
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Choose category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.categoryId}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="rich-text-shell">
                    <textarea
                      value={formData.description}
                      onChange={(event) => handleDescriptionChange(event.target.value)}
                      className={`min-h-40 w-full rounded-md border bg-white p-3 text-gray-900 shadow-sm outline-none focus:border-primary-500 focus:ring-primary-500 ${
                        validationErrors.description ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Regular price (EUR)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    name="regularPrice"
                    value={formData.regularPrice}
                    onChange={handleInputChange}
                    min="0"
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.regularPrice
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.regularPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.regularPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sale price (EUR)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleInputChange}
                    min="0"
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.discountedPrice
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.discountedPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.discountedPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.stock
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.stock && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.stock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercentage: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {validationErrors.discountPercentage && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.discountPercentage}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Main image URL
                  </label>
                  <input
                    type="url"
                    name="mainImageUrl"
                    value={formData.mainImageUrl}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      validationErrors.mainImageUrl
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {validationErrors.mainImageUrl && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.mainImageUrl}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Secondary image URLs
                    </label>
                    <button
                      type="button"
                      onClick={addSecondaryImageField}
                      className="text-sm text-white bg-primary-600 hover:text-gray-900 hover:bg-primary-700"
                    >
                      + Add image
                    </button>
                  </div>

                  {formData.secondaryImages.map((url, index) => (
                    <div
                      key={index}
                      className="mb-2 flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        type="url"
                        value={url.uri}
                        onChange={(e) =>
                          handleSecondaryImageChange(index, e.target.value)
                        }
                        placeholder="Secondary image URL"
                        className={`flex-1 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                          validationErrors.secondaryImages?.[index]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {formData.secondaryImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSecondaryImageField(index)}
                          className="text-white bg-red-600 hover:bg-red-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {validationErrors.secondaryImages?.some((error) => error) && (
                    <p className="mt-1 text-sm text-red-600">
                      Enter valid image URLs.
                    </p>
                  )}
                </div>

                <ProductPricingAndUploadFields
                  key={editingProduct?.id ?? "new-product"}
                  token={token}
                  regularPrice={formData.regularPrice}
                  defaultRetailPrice={editingProduct?.regularPrice}
                  defaultWholesalePrice={
                    editingProduct?.wholesalePriceInclVat ??
                    editingProduct?.wholesalePrice
                  }
                  currentMainImageUrl={formData.mainImageUrl}
                  currentSecondaryImages={formData.secondaryImages}
                  onImagesChange={(mainImageUrl, secondaryImages) => {
                    setFormData((previous) => ({
                      ...previous,
                      mainImageUrl,
                      secondaryImages,
                    }));
                    setValidationErrors((previous) => ({
                      ...previous,
                      mainImageUrl: undefined,
                      secondaryImages: undefined,
                    }));
                  }}
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setFormData({
                      name: "",
                      description: "",
                      categoryId: "",
                      regularPrice: "",
                      discountedPrice: "",
                      stock: "",
                      discountPercentage: "0",
                      mainImageUrl: "",
                      secondaryImages: [{ uri: "" }],
                    });
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a]"
                >
                  {editingProduct ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Delete product
            </h2>
            <p className="mb-6 text-gray-600">
              Delete the product "{productToDelete.title}"?
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;