"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterSidebar from "../components/products/FilterSidebar";
import ProductDetails from "./ProductDetails";

type Category = { id: string; name: string };
type Filters = {
  category?: string | null;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  rating?: number | null;
};

const ProductDetailsWithFilters = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`);
        const data = response.ok ? await response.json() : [];
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) setCategories(list);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const applyFilters = (filters: Filters) => {
    const hasFilters = Boolean(
      filters.category ||
      filters.search?.trim() ||
      (filters.minPrice !== null && filters.minPrice !== undefined) ||
      (filters.maxPrice !== null && filters.maxPrice !== undefined) ||
      (filters.rating !== null && filters.rating !== undefined)
    );
    if (!hasFilters) return;

    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    if (filters.minPrice !== null && filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.rating !== null && filters.rating !== undefined) params.set("rating", String(filters.rating));
    navigate(`/products?${params.toString()}`);
  };

  if (!ready) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-slate-50"><div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="flex flex-col gap-5 sm:gap-8 xl:flex-row xl:items-start">
          <div className="hidden w-72 shrink-0 xl:block">
            <FilterSidebar
              categories={categories}
              selectedCategory={null}
              searchQuery=""
              selectedMinPrice={null}
              selectedMaxPrice={null}
              selectedRating={null}
              suppressInitialAutoApply
              onApplyFilters={applyFilters}
            />
          </div>
          <div className="min-w-0 flex-1 [&>main]:bg-transparent [&>main]:px-0 [&>main]:py-0 [&>main>div]:max-w-none">
            <ProductDetails />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsWithFilters;
