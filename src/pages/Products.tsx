import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bars3Icon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import ProductCard from "../components/products/ProductCard";
import FilterSidebar from "../components/products/FilterSidebar";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { formatCurrency } from "../utils/currency";
import { Product } from "../types";

interface FilterState {
  category: string | null;
  search: string;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  pageSize: number;
  pageNumber: number;
  sortBy: string;
  sortDescending: boolean;
}

interface Category {
  id: string;
  name: string;
}

type ViewMode = "grid" | "list";

const PAGE_SIZE_STORAGE_KEY = "storeProductsPageSize";
const VIEW_MODE_STORAGE_KEY = "storeProductsViewMode";

const getInitialPageSize = () => {
  if (typeof window === "undefined") return 100;
  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return [20, 50, 100].includes(saved) ? saved : 100;
};

const getInitialViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  return window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "list"
    ? "list"
    : "grid";
};

const Products = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    search: "",
    minPrice: null,
    maxPrice: null,
    rating: null,
    pageSize: getInitialPageSize(),
    pageNumber: 1,
    sortBy: "rating",
    sortDescending: true,
  });
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Categories`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.items && Array.isArray(data.items)) {
          setCategories(data.items);
        } else {
          console.error("Unexpected categories response format:", data);
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");
    const pageSize = Number(searchParams.get("pageSize"));
    const pageNumber = Number(searchParams.get("page"));
    const sortBy = searchParams.get("sortBy");
    const sortDescending = searchParams.get("sortDescending");

    setFilters((prev) => ({
      ...prev,
      category: category || null,
      search: search || "",
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      rating: rating ? Number(rating) : null,
      pageSize: [20, 50, 100].includes(pageSize) ? pageSize : prev.pageSize,
      pageNumber: pageNumber > 0 ? pageNumber : 1,
      sortBy: sortBy || prev.sortBy,
      sortDescending:
        sortDescending === "true"
          ? true
          : sortDescending === "false"
            ? false
            : prev.sortDescending,
    }));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/Products`;
        const params = new URLSearchParams();

        if (filters.search.trim() !== "") {
          params.append("Title", filters.search.trim());
        }
        if (filters.category) {
          params.append("CategoryId", filters.category);
        }
        if (filters.minPrice !== null) {
          params.append("MinPrice", filters.minPrice.toString());
        }
        if (filters.maxPrice !== null) {
          params.append("MaxPrice", filters.maxPrice.toString());
        }
        if (filters.rating !== null) {
          params.append("MinRating", filters.rating.toString());
        }

        params.append("PageSize", filters.pageSize.toString());
        params.append("PageNumber", filters.pageNumber.toString());
        params.append("SortBy", filters.sortBy);
        params.append("SortDescending", filters.sortDescending.toString());

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data);
          setTotalCount(data.length);
        } else if (data.items && Array.isArray(data.items)) {
          setProducts(data.items);
          setTotalCount(data.totalCount || data.items.length);
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalCount(0);
      }
    };

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(fetchProducts, 100);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [filters]);

  const syncUrl = (updatedFilters: FilterState) => {
    const newParams = new URLSearchParams();

    if (updatedFilters.category) newParams.set("category", updatedFilters.category);
    if (updatedFilters.search) newParams.set("search", updatedFilters.search);
    if (updatedFilters.minPrice !== null) {
      newParams.set("minPrice", updatedFilters.minPrice.toString());
    }
    if (updatedFilters.maxPrice !== null) {
      newParams.set("maxPrice", updatedFilters.maxPrice.toString());
    }
    if (updatedFilters.rating !== null) {
      newParams.set("rating", updatedFilters.rating.toString());
    }

    newParams.set("pageSize", updatedFilters.pageSize.toString());
    newParams.set("page", updatedFilters.pageNumber.toString());
    newParams.set("sortBy", updatedFilters.sortBy);
    newParams.set("sortDescending", updatedFilters.sortDescending.toString());
    setSearchParams(newParams);
  };

  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      pageNumber: 1,
    };
    setFilters(updatedFilters);
    syncUrl(updatedFilters);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(event.target.value);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, newPageSize.toString());
    const updatedFilters = {
      ...filters,
      pageSize: newPageSize,
      pageNumber: 1,
    };
    setFilters(updatedFilters);
    syncUrl(updatedFilters);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, direction] = event.target.value.split(":");
    const updatedFilters = {
      ...filters,
      sortBy,
      sortDescending: direction === "desc",
      pageNumber: 1,
    };
    setFilters(updatedFilters);
    syncUrl(updatedFilters);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const handlePageChange = (newPage: number) => {
    const updatedFilters = { ...filters, pageNumber: newPage };
    setFilters(updatedFilters);
    syncUrl(updatedFilters);
  };

  const totalPages = Math.ceil(totalCount / filters.pageSize);
  const currentSortValue = `${filters.sortBy}:${filters.sortDescending ? "desc" : "asc"}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <span>{isBg ? "Подреди:" : "Sort:"}</span>
              <select
                value={currentSortValue}
                onChange={handleSortChange}
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
              >
                <option value="rating:desc">{isBg ? "Най-популярни" : "Most popular"}</option>
                <option value="createdOn:desc">{isBg ? "Най-нови" : "Newest"}</option>
                <option value="regularPrice:asc">{isBg ? "Цена: ниска към висока" : "Price: low to high"}</option>
                <option value="regularPrice:desc">{isBg ? "Цена: висока към ниска" : "Price: high to low"}</option>
                <option value="title:asc">{isBg ? "Име: А-Я" : "Name: A-Z"}</option>
                <option value="title:desc">{isBg ? "Име: Я-А" : "Name: Z-A"}</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-800">
              <span>{isBg ? "Продукти на страница:" : "Products per page:"}</span>
              <select
                value={filters.pageSize}
                onChange={handlePageSizeChange}
                className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
              >
                <option value="20">20 {isBg ? "на страница" : "per page"}</option>
                <option value="50">50 {isBg ? "на страница" : "per page"}</option>
                <option value="100">100 {isBg ? "на страница" : "per page"}</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-800">
            <span>{isBg ? "Покажи:" : "View:"}</span>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white">
              <button
                type="button"
                onClick={() => handleViewModeChange("list")}
                aria-label={isBg ? "Списъчен изглед" : "List view"}
                className={`flex h-10 w-10 items-center justify-center border-r border-slate-300 transition ${
                  viewMode === "list"
                    ? "bg-slate-100 text-[#18b99f]"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                aria-label={isBg ? "Табличен изглед" : "Grid view"}
                className={`flex h-10 w-10 items-center justify-center transition ${
                  viewMode === "grid"
                    ? "bg-slate-100 text-[#18b99f]"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 sm:gap-8 xl:flex-row">
          <FilterSidebar
            categories={categories}
            selectedCategory={filters.category}
            searchQuery={filters.search}
            onApplyFilters={handleApplyFilters}
          />

          <div className="min-w-0 flex-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const displayPrice =
                    product.discountedPrice && product.discountedPrice > 0
                      ? product.discountedPrice
                      : product.regularPrice;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#18b99f]/50 hover:shadow-md sm:items-center"
                    >
                      <div className="h-24 w-24 flex-none overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-28">
                        <img
                          src={product.mainImageUrl || "/placeholder-image.jpg"}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-950 sm:text-lg">
                          {product.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {product.description?.replace(/<[^>]+>/g, " ")}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="font-bold text-slate-950">
                            {formatCurrency(displayPrice)}
                          </span>
                          {product.discountedPrice && product.discountedPrice > 0 ? (
                            <span className="text-sm text-slate-400 line-through">
                              {formatCurrency(product.regularPrice)}
                            </span>
                          ) : null}
                          <span
                            className={`text-xs font-medium ${
                              product.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {product.quantity > 0
                              ? isBg
                                ? `${product.quantity} бр. налични`
                                : `${product.quantity} available`
                              : isBg
                                ? "Няма наличност"
                                : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {products.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:py-16">
                <p className="text-base text-slate-600 sm:text-lg">
                  {isBg
                    ? "Няма продукти, отговарящи на избраните филтри."
                    : "No products match the current filters."}
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex max-w-full flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.pageNumber === 1}
                    className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.pageNumber - 1)}
                    disabled={filters.pageNumber === 1}
                    className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &lsaquo;
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= filters.pageNumber - 2 &&
                          page <= filters.pageNumber + 2)
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-1 sm:px-2">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`min-h-11 min-w-11 rounded-md px-3 py-1 ${
                            filters.pageNumber === page
                              ? "bg-primary-600 text-white"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    onClick={() => handlePageChange(filters.pageNumber + 1)}
                    disabled={filters.pageNumber === totalPages}
                    className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={filters.pageNumber === totalPages}
                    className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
