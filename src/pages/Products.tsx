import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Bars3Icon, ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import ProductCard from "../components/products/ProductCard";
import ProductListRow from "../components/products/ProductListRow";
import FilterSidebar from "../components/products/FilterSidebar";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { entitySeoSlug } from "../utils/seo";
import { Product } from "../types";

interface FilterState {
  category: string | null;
  search: string;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  inStockOnly: boolean;
  pageSize: number;
  pageNumber: number;
  sortBy: string;
  sortDescending: boolean;
}

interface Category {
  id: string;
  name: string;
}

type ViewMode = "grid" | "list" | "compact";

const PAGE_SIZE_STORAGE_KEY = "storeProductsPageSize";
const VIEW_MODE_STORAGE_KEY = "storeProductsViewMode";

const getInitialPageSize = () => {
  if (typeof window === "undefined") return 100;
  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return [20, 50, 100].includes(saved) ? saved : 100;
};

const getInitialViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  const saved = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return saved === "list" || saved === "compact" ? saved : "grid";
};

const Products = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const { categoryId: routeCategoryId, categorySlug: routeCategorySlug } = useParams<{ categoryId?: string; categorySlug?: string }>();
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
    inStockOnly: false,
    pageSize: getInitialPageSize(),
    pageNumber: 1,
    sortBy: "rating",
    sortDescending: true,
  });
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`);
        const data = await response.json();
        if (Array.isArray(data)) setCategories(data);
        else if (data.items && Array.isArray(data.items)) setCategories(data.items);
        else setCategories([]);
      } catch {
        setCategories([]);
      }
    };

    void fetchCategories();
  }, []);

  useEffect(() => {
    const pageSize = Number(searchParams.get("pageSize"));
    const pageNumber = Number(searchParams.get("page"));
    const sortDescending = searchParams.get("sortDescending");

    setFilters((previous) => ({
      ...previous,
      category: searchParams.get("category") || null,
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
      rating: searchParams.get("rating") ? Number(searchParams.get("rating")) : null,
      inStockOnly: searchParams.get("inStock") === "true",
      pageSize: [20, 50, 100].includes(pageSize) ? pageSize : previous.pageSize,
      pageNumber: pageNumber > 0 ? pageNumber : 1,
      sortBy: searchParams.get("sortBy") || previous.sortBy,
      sortDescending:
        sortDescending === "true"
          ? true
          : sortDescending === "false"
            ? false
            : previous.sortDescending,
    }));
  }, []);

  useEffect(() => {
    if (routeCategoryId) {
      setFilters((previous) => ({ ...previous, category: routeCategoryId, pageNumber: 1 }));
      return;
    }

    if (!routeCategorySlug || categories.length === 0) return;

    const match = categories.find(
      (category) => entitySeoSlug(category.name, category.id) === routeCategorySlug.toLowerCase()
    );

    if (match) {
      setFilters((previous) => ({ ...previous, category: match.id, pageNumber: 1 }));
    }
  }, [categories, routeCategoryId, routeCategorySlug]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search.trim()) params.set("Title", filters.search.trim());
        if (filters.category) params.set("CategoryId", filters.category);
        if (filters.minPrice !== null) params.set("MinPrice", filters.minPrice.toString());
        if (filters.maxPrice !== null) params.set("MaxPrice", filters.maxPrice.toString());
        if (filters.rating !== null) params.set("MinRating", filters.rating.toString());
        if (filters.inStockOnly) params.set("InStockOnly", "true");
        params.set("PageSize", filters.pageSize.toString());
        params.set("PageNumber", filters.pageNumber.toString());
        params.set("SortBy", filters.sortBy);
        params.set("SortDescending", filters.sortDescending.toString());

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${params.toString()}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
          setTotalCount(data.length);
        } else if (Array.isArray(data.items)) {
          setProducts(data.items);
          setTotalCount(Number(data.totalCount ?? data.items.length));
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } catch {
        setProducts([]);
        setTotalCount(0);
      }
    };

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => void fetchProducts(), 100);
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [filters]);

  const syncUrl = (next: FilterState) => {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.search) params.set("search", next.search);
    if (next.minPrice !== null) params.set("minPrice", next.minPrice.toString());
    if (next.maxPrice !== null) params.set("maxPrice", next.maxPrice.toString());
    if (next.rating !== null) params.set("rating", next.rating.toString());
    if (next.inStockOnly) params.set("inStock", "true");
    params.set("pageSize", next.pageSize.toString());
    params.set("page", next.pageNumber.toString());
    params.set("sortBy", next.sortBy);
    params.set("sortDescending", next.sortDescending.toString());
    setSearchParams(params);
  };

  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    const next = { ...filters, ...newFilters, pageNumber: 1 };
    setFilters(next);
    syncUrl(next);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const pageSize = Number(event.target.value);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, pageSize.toString());
    const next = { ...filters, pageSize, pageNumber: 1 };
    setFilters(next);
    syncUrl(next);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, direction] = event.target.value.split(":");
    const next = { ...filters, sortBy, sortDescending: direction === "desc", pageNumber: 1 };
    setFilters(next);
    syncUrl(next);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const handlePageChange = (pageNumber: number) => {
    const next = { ...filters, pageNumber };
    setFilters(next);
    syncUrl(next);
  };

  const totalPages = Math.ceil(totalCount / filters.pageSize);
  const currentSortValue = `${filters.sortBy}:${filters.sortDescending ? "desc" : "asc"}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:mb-7 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div className="grid w-full grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-800 sm:flex-row sm:items-center sm:gap-2">
              <span>{isBg ? "Подреди:" : "Sort:"}</span>
              <select value={currentSortValue} onChange={handleSortChange} className="min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#18b99f] sm:w-auto sm:px-3">
                <option value="rating:desc">{isBg ? "Най-популярни" : "Most popular"}</option>
                <option value="createdOn:desc">{isBg ? "Най-нови" : "Newest"}</option>
                <option value="regularPrice:asc">{isBg ? "Цена: ниска към висока" : "Price: low to high"}</option>
                <option value="regularPrice:desc">{isBg ? "Цена: висока към ниска" : "Price: high to low"}</option>
                <option value="title:asc">{isBg ? "Име: А-Я" : "Name: A-Z"}</option>
                <option value="title:desc">{isBg ? "Име: Я-А" : "Name: Z-A"}</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-800 sm:flex-row sm:items-center sm:gap-2">
              <span>{isBg ? "Продукти на страница:" : "Products per page:"}</span>
              <select value={filters.pageSize} onChange={handlePageSizeChange} className="min-h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#18b99f] sm:w-auto sm:px-3">
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>

          <div className="flex w-full items-center justify-between gap-2 text-sm text-slate-800 sm:w-auto sm:justify-start">
            <span>{isBg ? "Покажи:" : "View:"}</span>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-300 bg-white">
              <button type="button" onClick={() => handleViewModeChange("compact")} className={`flex h-10 w-10 items-center justify-center border-r border-slate-300 ${viewMode === "compact" ? "bg-slate-100 text-orange-500" : "text-slate-500 hover:bg-slate-50"}`} title={isBg ? "Компактен списък" : "Compact list"}>
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => handleViewModeChange("list")} className={`flex h-10 w-10 items-center justify-center border-r border-slate-300 ${viewMode === "list" ? "bg-slate-100 text-orange-500" : "text-slate-500 hover:bg-slate-50"}`} title={isBg ? "Подробен списък" : "Detailed list"}>
                <Bars3Icon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => handleViewModeChange("grid")} className={`flex h-10 w-10 items-center justify-center ${viewMode === "grid" ? "bg-slate-100 text-orange-500" : "text-slate-500 hover:bg-slate-50"}`} title={isBg ? "Карти" : "Grid"}>
                <Squares2X2Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-8 xl:flex-row">
          <FilterSidebar
            categories={categories}
            selectedCategory={filters.category}
            searchQuery={filters.search}
            selectedMinPrice={filters.minPrice}
            selectedMaxPrice={filters.maxPrice}
            selectedRating={filters.rating}
            selectedInStockOnly={filters.inStockOnly}
            onApplyFilters={handleApplyFilters}
          />

          <div className="min-w-0 flex-1">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-2.5 min-[430px]:gap-3 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : viewMode === "compact" ? (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {products.map((product) => <ProductListRow key={product.id} product={product} compact />)}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => <ProductListRow key={product.id} product={product} />)}
              </div>
            )}

            {products.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm sm:py-16">
                <p className="text-base text-slate-600 sm:text-lg">{isBg ? "Няма продукти, отговарящи на избраните филтри." : "No products match the current filters."}</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex max-w-full flex-wrap items-center justify-center gap-2">
                  <button onClick={() => handlePageChange(1)} disabled={filters.pageNumber === 1} className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50">&laquo;</button>
                  <button onClick={() => handlePageChange(filters.pageNumber - 1)} disabled={filters.pageNumber === 1} className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50">&lsaquo;</button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((page) => page === 1 || page === totalPages || (page >= filters.pageNumber - 2 && page <= filters.pageNumber + 2))
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 ? <span className="px-1 sm:px-2">...</span> : null}
                        <button onClick={() => handlePageChange(page)} className={`min-h-11 min-w-11 rounded-md px-3 py-1 ${filters.pageNumber === page ? "bg-primary-600 text-white" : "border border-gray-300 hover:bg-gray-100"}`}>{page}</button>
                      </React.Fragment>
                    ))}
                  <button onClick={() => handlePageChange(filters.pageNumber + 1)} disabled={filters.pageNumber === totalPages} className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50">&rsaquo;</button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={filters.pageNumber === totalPages} className="min-h-11 min-w-11 rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50">&raquo;</button>
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
