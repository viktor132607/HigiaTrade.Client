import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import FilterSidebar from "../components/products/FilterSidebar";
import { Product } from "../types";

interface FilterState {
  category: string | null;
  search: string;
  minPrice: number | null;
  maxPrice: number | null;
  rating: number | null;
  pageSize: number;
  pageNumber: number;
}

interface Category {
  id: string;
  name: string;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    search: "",
    minPrice: null,
    maxPrice: null,
    rating: null,
    pageSize: 10,
    pageNumber: 1,
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

    setFilters((prev) => ({
      ...prev,
      category: category || null,
      search: search || "",
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      rating: rating ? Number(rating) : null,
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
        if (filters.pageSize) {
          params.append("PageSize", filters.pageSize.toString());
        }
        if (filters.pageNumber) {
          params.append("PageNumber", filters.pageNumber.toString());
        }

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
      if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    }

    fetchTimeoutRef.current = setTimeout(fetchProducts, 100);

    return () => {
      if (fetchTimeoutRef.current) {
        if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
      }
    };
  }, [filters]);

  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };

    setFilters(updatedFilters);

    const newParams = new URLSearchParams();
    if (updatedFilters.category) {
      newParams.set("category", updatedFilters.category);
    }
    if (updatedFilters.search) {
      newParams.set("search", updatedFilters.search);
    }
    if (updatedFilters.minPrice !== null) {
      newParams.set("minPrice", updatedFilters.minPrice.toString());
    }
    if (updatedFilters.maxPrice !== null) {
      newParams.set("maxPrice", updatedFilters.maxPrice.toString());
    }
    if (updatedFilters.rating !== null) {
      newParams.set("rating", updatedFilters.rating.toString());
    }

    setSearchParams(newParams);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value);
    setFilters((prev) => ({ ...prev, pageSize: newPageSize }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("pageSize", newPageSize.toString());
      return newParams;
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", newPage.toString());
      return newParams;
    });
  };

  const totalPages = Math.ceil(totalCount / filters.pageSize);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name || null;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Store</p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                {getCategoryName(filters.category)
                  ? `${getCategoryName(filters.category)} products`
                  : "All products"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Showing {products.length} of {totalCount} products. Use category, price, and rating filters to narrow the list.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <label htmlFor="pageSize" className="text-sm text-slate-600">
                  Per page:
                </label>
                <select
                  id="pageSize"
                  value={filters.pageSize}
                  onChange={handlePageSizeChange}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 outline-none"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 xl:flex-row">
          <FilterSidebar
            categories={categories}
            selectedCategory={filters.category}
            searchQuery={filters.search}
            onApplyFilters={handleApplyFilters}
          />

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

              {products.length === 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white py-16 text-center shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)]">
                  <p className="text-lg text-slate-600">
                    No products match the current filters.
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex max-w-full flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={filters.pageNumber === 1}
                    className="min-w-[2.5rem] rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.pageNumber - 1)}
                    disabled={filters.pageNumber === 1}
                    className="min-w-[2.5rem] rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
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
                          <span className="px-2">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[2.5rem] rounded-md px-3 py-1 ${
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
                    className="min-w-[2.5rem] rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={filters.pageNumber === totalPages}
                    className="min-w-[2.5rem] rounded-md border border-gray-300 px-3 py-1 disabled:opacity-50"
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
