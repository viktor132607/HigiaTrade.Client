"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { categorySeoPath } from "../../utils/seo";

type ProductSummary = {
  id: string;
  title: string;
  categoryId: string;
  categoryName?: string;
};

type CategorySummary = {
  id: string;
  name: string;
  parentCategoryId?: string | null;
};

const ProductBreadcrumb = () => {
  const location = useLocation();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  const match = location.pathname.match(/^\/products\/([^/]+)$/i);
  const routeValue = match?.[1] ? decodeURIComponent(match[1]) : null;

  useEffect(() => {
    if (!routeValue) {
      setProduct(null);
      setCategories([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        let productId = routeValue;
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeValue);

        if (!isGuid) {
          const tokenPart = routeValue.match(/-([0-9a-f]{8})$/i)?.[1]?.toLowerCase();
          if (tokenPart) {
            const listResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);
            if (listResponse.ok) {
              const data = await listResponse.json();
              const list: ProductSummary[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
              productId = list.find((item) => String(item.id).replace(/-/g, "").toLowerCase().startsWith(tokenPart))?.id ?? routeValue;
            }
          }
        }

        const [productResponse, categoriesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`),
        ]);

        if (!productResponse.ok) throw new Error("Unable to load breadcrumb product");

        const productData = await productResponse.json() as ProductSummary;
        const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
        const categoryList: CategorySummary[] = Array.isArray(categoriesData)
          ? categoriesData
          : Array.isArray(categoriesData?.items)
            ? categoriesData.items
            : [];

        if (!cancelled) {
          setProduct(productData);
          setCategories(categoryList);
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
          setCategories([]);
        }
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [routeValue]);

  const path = useMemo(() => {
    if (!product) return [];

    const current = categories.find((category) => category.id === product.categoryId)
      ?? (product.categoryName ? { id: product.categoryId, name: product.categoryName, parentCategoryId: null } : null);

    if (!current) return [];

    const parent = current.parentCategoryId
      ? categories.find((category) => category.id === current.parentCategoryId) ?? null
      : null;

    return parent ? [parent, current] : [current];
  }, [categories, product]);

  if (!routeValue || !product) return null;

  return (
    <nav aria-label={isBg ? "Път" : "Breadcrumb"} className="border-b border-slate-200 bg-white/95">
      <div className="site-container flex min-h-12 items-center gap-1.5 overflow-x-auto whitespace-nowrap py-2 text-sm text-slate-500">
        {path.map((category, index) => (
          <span key={category.id} className="contents">
            {index > 0 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />}
            <Link to={categorySeoPath(category)} className="shrink-0 font-semibold text-[#159b87] transition hover:text-[#117c6d]">
              {category.name}
            </Link>
          </span>
        ))}
        {path.length > 0 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />}
        <span className="max-w-[34rem] truncate font-bold text-slate-800" title={product.title}>{product.title}</span>
      </div>
    </nav>
  );
};

export default ProductBreadcrumb;
