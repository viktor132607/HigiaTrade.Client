import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { formatCurrency } from "../../utils/currency";

type SearchProduct = {
  id: string;
  title: string;
  mainImageUrl?: string;
  regularPrice: number;
  discountedPrice?: number;
  quantity: number;
};

type SearchTarget = {
  input: HTMLInputElement;
  form: HTMLFormElement;
  mount: HTMLDivElement;
};

const ProductSearchEnhancer = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const targetsRef = useRef<SearchTarget[]>([]);
  const debounceRef = useRef<number | null>(null);
  const [activeTarget, setActiveTarget] = useState<SearchTarget | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanupTargets = () => {
      targetsRef.current.forEach(({ input, form, mount }) => {
        input.removeAttribute("data-product-search-enhanced");
        mount.remove();
      });
      targetsRef.current = [];
      setActiveTarget(null);
    };

    const attach = () => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('header input[type="search"]')
      ).filter((input) => !input.dataset.productSearchEnhanced);

      inputs.forEach((input) => {
        const form = input.closest("form");
        const wrapper = input.parentElement;
        if (!form || !wrapper) return;

        input.dataset.productSearchEnhanced = "true";
        input.placeholder = isBg ? "ТЪРСЕНЕ НА ПРОДУКТ" : "PRODUCT SEARCH";
        input.setAttribute("aria-label", isBg ? "Търсене на продукт" : "Product search");

        const mount = document.createElement("div");
        mount.dataset.productSearchResults = "true";
        wrapper.appendChild(mount);

        const target: SearchTarget = { input, form, mount };
        targetsRef.current.push(target);

        const handleInput = () => {
          setQuery(input.value);
          setActiveTarget(target);
        };

        const handleFocus = () => {
          setQuery(input.value);
          setActiveTarget(target);
        };

        const handleSubmit = (event: Event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const value = input.value.trim();
          const url = value
            ? `/products?search=${encodeURIComponent(value)}`
            : "/products";
          window.location.assign(url);
        };

        input.addEventListener("input", handleInput);
        input.addEventListener("focus", handleFocus);
        form.addEventListener("submit", handleSubmit, true);

        (target as SearchTarget & { cleanup?: () => void }).cleanup = () => {
          input.removeEventListener("input", handleInput);
          input.removeEventListener("focus", handleFocus);
          form.removeEventListener("submit", handleSubmit, true);
        };
      });
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      targetsRef.current.forEach((target) => {
        (target as SearchTarget & { cleanup?: () => void }).cleanup?.();
      });
      cleanupTargets();
    };
  }, [isBg]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const normalized = query.trim();
    if (normalized.length < 2 || !activeTarget) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          Title: normalized,
          PageNumber: "1",
          PageSize: "6",
          SortBy: "title",
          SortDescending: "false",
        });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?${params.toString()}`
        );
        if (!response.ok) throw new Error("Search failed");
        const payload = await response.json();
        setResults(Array.isArray(payload) ? payload.slice(0, 6) : (payload.items ?? []).slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, activeTarget]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideSearch = targetsRef.current.some(
        ({ input, mount }) => input.contains(target) || mount.contains(target)
      );
      if (!insideSearch) setActiveTarget(null);
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  if (!activeTarget || query.trim().length < 2) return null;

  return createPortal(
    <div className="absolute left-0 right-0 top-full z-[90] mt-1 overflow-hidden border border-slate-200 bg-white shadow-xl dark:border-white/20 dark:bg-slate-950">
      {loading ? (
        <div className="px-4 py-3 text-sm text-slate-500">
          {isBg ? "Търсене..." : "Searching..."}
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((product) => {
            const price =
              product.discountedPrice && product.discountedPrice > 0
                ? product.discountedPrice
                : product.regularPrice;

            return (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  window.location.assign(`/products/${product.id}`);
                }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
              >
                <div className="h-12 w-12 flex-none overflow-hidden rounded-md bg-slate-100">
                  {product.mainImageUrl ? (
                    <img
                      src={product.mainImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {product.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#18b99f]">{formatCurrency(price)}</span>
                    <span className={product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
                      {product.quantity > 0
                        ? isBg
                          ? "В наличност"
                          : "In stock"
                        : isBg
                          ? "Няма наличност"
                          : "Out of stock"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              window.location.assign(`/products?search=${encodeURIComponent(query.trim())}`);
            }}
            className="w-full bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-[#18b99f] hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10"
          >
            {isBg ? `Виж всички резултати за „${query.trim()}“` : `View all results for “${query.trim()}”`}
          </button>
        </>
      ) : (
        <div className="px-4 py-3 text-sm text-slate-500">
          {isBg ? "Няма намерени продукти." : "No products found."}
        </div>
      )}
    </div>,
    activeTarget.mount
  );
};

export default ProductSearchEnhancer;
