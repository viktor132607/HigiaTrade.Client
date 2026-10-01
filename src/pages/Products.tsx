import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Bars3Icon, ChevronRightIcon, ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import ProductCard from "../components/products/ProductCard";
import ProductListRow from "../components/products/ProductListRow";
import FilterSidebar from "../components/products/FilterSidebar";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { categorySeoPath, entitySeoSlug } from "../utils/seo";
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
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParamsKey = searchParams.toString();
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
    const currentSearchParams = new URLSearchParams(searchParamsKey);
    const pageSize = Number(currentSearchParams.get("pageSize"));
    const pageNumber = Number(currentSearchParams.get("page"));
    const sortDescending = currentSearchParams.get("sortDescending");

    setFilters((previous) => ({
      ...previous,
      category: currentSearchParams.get("category") || null,
      search: currentSearchParams.get("search") || "",
      minPrice: currentSearchParams.get("minPrice") ? Number(currentSearchParams.get("minPrice")) : null,
      maxPrice: currentSearchParams.get("maxPrice") ? Number(currentSearchParams.get("maxPrice")) : null,
      rating: currentSearchParams.get("rating") ? Number(currentSearchParams.get("rating")) : null,
      inStockOnly: currentSearchParams.get("inStock") === "true",
      pageSize: [20, 50, 100].includes(pageSize) ? pageSize : previous.pageSize,
      pageNumber: pageNumber > 0 ? pageNumber : 1,
      sortBy: currentSearchParams.get("sortBy") || previous.sortBy,
      sortDescending:
        sortDescending === "true"
          ? true
          : sortDescending === "false"
            ? false
            : previous.sortDescending,
    }));
  }, [searchParamsKey]);

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
    const query = params.toString();
    navigate({ pathname: "/products", search: query ? `?${query}` : "" });
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
  const selectedCategory = categories.find((category) => category.id === filters.category) ?? null;
  const selectedParentCategory = selectedCategory?.parentCategoryId
    ? categories.find((category) => category.id === selectedCategory.parentCategoryId) ?? null
    : null;
  const routeCategoryMatchesCurrent = routeCategoryId
    ? filters.category === routeCategoryId
    : routeCategorySlug
      ? Boolean(selectedCategory && entitySeoSlug(selectedCategory.name, selectedCategory.id) === routeCategorySlug.toLowerCase())
      : true;

  const catalogPath = selectedCategory
    ? selectedParentCategory
      ? [selectedParentCategory, selectedCategory]
      : [selectedCategory]
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-x-5">
          <div className="xl:col-start-1">
            <FilterSidebar
              categories={categories}
              selectedCategory={filters.category}
              searchQuery={filters.search}
              selectedMinPrice={filters.minPrice}
              selectedMaxPrice={filters.maxPrice}
              selectedRating={filters.rating}
              selectedInStockOnly={filters.inStockOnly}
              suppressInitialAutoApply={Boolean((routeCategoryId || routeCategorySlug) && !routeCategoryMatchesCurrent)}
              onApplyFilters={handleApplyFilters}
            />
          </div>

          <div className="min-w-0 space-y-5 xl:col-start-2">
            <div className="flex min-h-14 min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4 xl:flex-row xl:items-center">
            <nav aria-label={isBg ? "Път" : "Breadcrumb"} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm text-slate-500">
              {catalogPath.length === 0 ? (
                <span className="font-semibold text-slate-800">{isBg ? "Продукти" : "Products"}</span>
              ) : (
                catalogPath.map((category, index) => (
                  <React.Fragment key={category.id}>
                    {index > 0 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />}
                    <button
                      type="button"
                      onClick={() => navigate(categorySeoPath(category))}
                      className={`shrink-0 transition hover:text-[#18b99f] ${index === catalogPath.length - 1 ? "font-bold text-slate-900" : "font-semibold text-[#159b87]"}`}
                    >
                      {category.name}
                    </button>
                  </React.Fragment>
                ))
              )}
            </nav>

            <div className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-nowrap">
              <select
                aria-label={isBg ? "Подреди продуктите" : "Sort products"}
                value={currentSortValue}
                onChange={handleSortChange}
                className="min-h-10 min-w-[170px] cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition hover:border-[#18b99f] focus:border-[#18b99f]"
              >
                <option value="rating:desc">{isBg ? "Най-популярни" : "Most popular"}</option>
                <option value="createdOn:desc">{isBg ? "Най-нови" : "Newest"}</option>
                <option value="regularPrice:asc">{isBg ? "Цена: ниска → висока" : "Price: low → high"}</option>
                <option value="regularPrice:desc">{isBg ? "Цена: висока → ниска" : "Price: high → low"}</option>
                <option value="title:asc">{isBg ? "Име: А-Я" : "Name: A-Z"}</option>
                <option value="title:desc">{isBg ? "Име: Я-А" : "Name: Z-A"}</option>
              </select>

              <select
                aria-label={isBg ? "Продукти на страница" : "Products per page"}
                value={filters.pageSize}
                onChange={handlePageSizeChange}
                className="min-h-10 w-20 cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none transition hover:border-[#18b99f] focus:border-[#18b99f]"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>

              <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-slate-800">
                <span className="hidden sm:inline">{isBg ? "Изглед:" : "View:"}</span>
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
          </div>

            <div className="min-w-0">
            {viewMode === "grid" ? (
              <div className="product-card-grid">
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
    </div>
  );
};

export default Products;
