"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FilterSidebar from "../products/FilterSidebar";

type Category = { id: string; name: string };
type Filters = {
  category?: string | null;
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  rating?: number | null;
};

const ProductDetailFilterRail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  const isProductDetails = /^\/products\/[^/]+$/i.test(location.pathname);

  useEffect(() => {
    if (!isProductDetails) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (!cancelled) setCategories(list);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isProductDetails]);

  if (!isProductDetails) return null;

  const applyFilters = (filters: Filters) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    if (filters.minPrice !== null && filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.rating !== null && filters.rating !== undefined) params.set("rating", String(filters.rating));
    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="fixed left-3 top-32 z-20 hidden w-72 2xl:block">
      <FilterSidebar
        categories={categories}
        selectedCategory={null}
        searchQuery=""
        selectedMinPrice={null}
        selectedMaxPrice={null}
        selectedRating={null}
        onApplyFilters={applyFilters}
      />
    </div>
  );
};

export default ProductDetailFilterRail;
