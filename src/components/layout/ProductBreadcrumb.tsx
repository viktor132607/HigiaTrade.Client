"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type ProductSummary = {
  id: string;
  title: string;
  categoryId: string;
  categoryName?: string;
};

const ProductBreadcrumb = () => {
  const location = useLocation();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [product, setProduct] = useState<ProductSummary | null>(null);

  const match = location.pathname.match(/^\/products\/([^/]+)$/i);
  const routeValue = match?.[1] ? decodeURIComponent(match[1]) : null;

  useEffect(() => {
    if (!routeValue) {
      setProduct(null);
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`);
        if (!response.ok) throw new Error("Unable to load breadcrumb product");
        const data = await response.json() as ProductSummary;
        if (!cancelled) setProduct(data);
      } catch {
        if (!cancelled) setProduct(null);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [routeValue]);

  if (!routeValue || !product) return null;

  return (
    <nav aria-label={isBg ? "Навигация" : "Breadcrumb"} className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-3 text-sm text-slate-500 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 font-medium transition hover:text-[#18b99f]">
          <HomeIcon className="h-4 w-4" />
          {isBg ? "Начало" : "Home"}
        </Link>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        <Link to="/products" className="shrink-0 font-medium transition hover:text-[#18b99f]">
          {isBg ? "Продукти" : "Products"}
        </Link>
        {product.categoryId ? <>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
          <Link to={`/category/${product.categoryId}`} className="shrink-0 font-semibold text-[#159b87] transition hover:text-[#117c6d]">
            {product.categoryName || (isBg ? "Категория" : "Category")}
          </Link>
        </> : null}
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
        <span className="max-w-[28rem] truncate font-medium text-slate-700" title={product.title}>{product.title}</span>
      </div>
    </nav>
  );
};

export default ProductBreadcrumb;
