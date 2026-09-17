import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { formatCurrency } from "../../utils/currency";
import { brandSeoPath, categorySeoPath, productSeoPath } from "../../utils/seo";

type SearchProduct = {
  id: string;
  title: string;
  mainImageUrl?: string;
  regularPrice: number;
  discountedPrice?: number;
  quantity: number;
};

type SearchBrand = {
  id?: string;
  name: string;
  productCount?: number;
};

type SearchCategory = {
  id: string;
  name: string;
  productCount?: number;
};

type SearchTarget = {
  input: HTMLInputElement;
  mount: HTMLDivElement;
  cleanup: () => void;
};

const normalizeList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const items = (payload as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
};

const ProductSearchEnhancer = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const locale = isBg ? "bg-BG" : "en-GB";
  const targetsRef = useRef<Map<HTMLInputElement, SearchTarget>>(new Map());
  const [activeTarget, setActiveTarget] = useState<SearchTarget | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [brands, setBrands] = useState<SearchBrand[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReferenceData = async () => {
      const [brandsResult, categoriesResult] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`).then(async (response) => {
          if (!response.ok) throw new Error("Brand search data failed to load");
          return response.json();
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`).then(async (response) => {
          if (!response.ok) throw new Error("Category search data failed to load");
          return response.json();
        }),
      ]);

      if (cancelled) return;

      setBrands(
        brandsResult.status === "fulfilled"
          ? normalizeList<SearchBrand>(brandsResult.value)
          : []
      );
      setCategories(
        categoriesResult.status === "fulfilled"
          ? normalizeList<SearchCategory>(categoriesResult.value)
          : []
      );
    };

    void loadReferenceData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const targets = targetsRef.current;

    const syncInputs = () => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[type="search"]:not([data-search-autocomplete="off"])'
        )
      );
      const currentInputs = new Set(inputs);

      for (const [input, target] of targets.entries()) {
        if (!currentInputs.has(input) || !input.isConnected) {
          target.cleanup();
          targets.delete(input);
          setActiveTarget((current) => (current === target ? null : current));
        }
      }

      inputs.forEach((input) => {
        if (targets.has(input)) return;

        const wrapper = input.parentElement;
        if (!wrapper) return;

        if (input.closest("header")) {
          input.placeholder = isBg ? "ТЪРСЕНЕ НА ПРОДУКТ" : "PRODUCT SEARCH";
          input.setAttribute("aria-label", isBg ? "Търсене на продукт" : "Product search");
        }

        const previousPosition = wrapper.style.position;
        const shouldMakeRelative = window.getComputedStyle(wrapper).position === "static";
        if (shouldMakeRelative) wrapper.style.position = "relative";

        const mount = document.createElement("div");
        mount.dataset.productSearchResults = "true";

        let target: SearchTarget;

        const handleInput = () => {
          setQuery(input.value);
          setActiveTarget(target);
        };

        const handleFocus = () => {
          setQuery(input.value);
          setActiveTarget(target);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === "Escape") setActiveTarget(null);
        };

        const cleanup = () => {
          input.removeEventListener("input", handleInput);
          input.removeEventListener("focus", handleFocus);
          input.removeEventListener("keydown", handleKeyDown);
          mount.remove();
          if (shouldMakeRelative) wrapper.style.position = previousPosition;
        };

        target = { input, mount, cleanup };
        targets.set(input, target);
        wrapper.appendChild(mount);
        input.addEventListener("input", handleInput);
        input.addEventListener("focus", handleFocus);
        input.addEventListener("keydown", handleKeyDown);
      });
    };

    syncInputs();
    const observer = new MutationObserver(syncInputs);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      targets.forEach((target) => target.cleanup());
      targets.clear();
      setActiveTarget(null);
    };
  }, [isBg]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2 || !activeTarget) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/Products?${params.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Search failed");
        const payload = await response.json();
        setResults(normalizeList<SearchProduct>(payload).slice(0, 6));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, activeTarget]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      const node = event.target as Node;
      const insideSearch = Array.from(targetsRef.current.values()).some(
        ({ input, mount }) => input.contains(node) || mount.contains(node)
      );
      if (!insideSearch) setActiveTarget(null);
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  const matchingBrands = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return brands
      .filter((brand) => brand.name.toLocaleLowerCase(locale).includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name, locale, { sensitivity: "base" }))
      .slice(0, 3);
  }, [brands, locale, normalizedQuery]);

  const matchingCategories = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return categories
      .filter((category) => category.name.toLocaleLowerCase(locale).includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name, locale, { sensitivity: "base" }))
      .slice(0, 3);
  }, [categories, locale, normalizedQuery]);

  if (
    !activeTarget ||
    !activeTarget.mount.isConnected ||
    normalizedQuery.length < 2
  ) {
    return null;
  }

  const hasResults = results.length > 0 || matchingBrands.length > 0 || matchingCategories.length > 0;

  return createPortal(
    <div className="absolute left-0 right-0 top-full z-[120] mt-1 max-h-[min(70vh,36rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/20 dark:bg-slate-950">
      {results.length > 0 && (
        <section>
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {isBg ? "Продукти" : "Products"}
          </div>
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
                  window.location.assign(productSeoPath(product));
                }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
              >
                <div className="h-12 w-12 flex-none overflow-hidden rounded-md bg-slate-100 dark:bg-white/10">
                  {product.mainImageUrl ? (
                    <img src={product.mainImageUrl} alt="" className="h-full w-full object-cover" />
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
                        ? isBg ? "В наличност" : "In stock"
                        : isBg ? "Няма наличност" : "Out of stock"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {loading && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {isBg ? "Търсене на продукти..." : "Searching products..."}
        </div>
      )}

      {matchingBrands.length > 0 && (
        <section>
          <div className="border-y border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {isBg ? "Марки" : "Brands"}
          </div>
          {matchingBrands.map((brand) => (
            <button
              key={brand.id ?? brand.name}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                window.location.assign(brandSeoPath(brand.name));
              }}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
            >
              <span className="truncate font-semibold text-slate-900 dark:text-white">{brand.name}</span>
              {typeof brand.productCount === "number" && (
                <span className="flex-none text-xs text-slate-500 dark:text-slate-400">
                  {isBg ? `${brand.productCount} продукта` : `${brand.productCount} products`}
                </span>
              )}
            </button>
          ))}
        </section>
      )}

      {matchingCategories.length > 0 && (
        <section>
          <div className="border-y border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {isBg ? "Категории" : "Categories"}
          </div>
          {matchingCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                window.location.assign(categorySeoPath(category));
              }}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
            >
              <span className="truncate font-semibold text-slate-900 dark:text-white">{category.name}</span>
              {typeof category.productCount === "number" && (
                <span className="flex-none text-xs text-slate-500 dark:text-slate-400">
                  {isBg ? `${category.productCount} продукта` : `${category.productCount} products`}
                </span>
              )}
            </button>
          ))}
        </section>
      )}

      {!loading && !hasResults && (
        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {isBg ? "Няма намерени резултати." : "No results found."}
        </div>
      )}

      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          window.location.assign(`/products?search=${encodeURIComponent(query.trim())}`);
        }}
        className="w-full border-t border-slate-100 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-[#18b99f] hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        {isBg ? `Виж всички резултати за „${query.trim()}“` : `View all results for “${query.trim()}”`}
      </button>
    </div>,
    activeTarget.mount
  );
};

export default ProductSearchEnhancer;
