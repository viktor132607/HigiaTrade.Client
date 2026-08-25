import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Category {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  selectedMinPrice?: number | null;
  selectedMaxPrice?: number | null;
  selectedRating?: number | null;
  suppressInitialAutoApply?: boolean;
  onApplyFilters: (filters: {
    category?: string | null;
    search?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    rating?: number | null;
  }) => void;
}

type PriceProduct = {
  regularPrice?: number;
  discountedPrice?: number | null;
};

const ratingBuckets = [5, 4, 3, 2, 1];

const FilterSidebar = ({
  categories,
  selectedCategory,
  searchQuery,
  selectedMinPrice = null,
  selectedMaxPrice = null,
  selectedRating: selectedRatingProp = null,
  suppressInitialAutoApply = false,
  onApplyFilters,
}: FilterSidebarProps) => {
  const { language } = useLanguageTheme();
  const location = useLocation();
  const isBg = language === "bg";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [minPrice, setMinPrice] = useState(selectedMinPrice === null ? "" : String(selectedMinPrice));
  const [maxPrice, setMaxPrice] = useState(selectedMaxPrice === null ? "" : String(selectedMaxPrice));
  const [selectedRating, setSelectedRating] = useState(selectedRatingProp ?? 0);
  const [priceFloor, setPriceFloor] = useState(0);
  const [priceCeiling, setPriceCeiling] = useState(100);
  const didRunAutoApply = useRef(false);

  const isCatalogPage =
    location.pathname === "/products" ||
    location.pathname === "/store" ||
    /^\/categories\/[^/]+$/i.test(location.pathname) ||
    /^\/category\/[^/]+$/i.test(location.pathname);

  useEffect(() => {
    if (!isCatalogPage) return;
    document.body.classList.add("catalog-filter-layout");
    return () => document.body.classList.remove("catalog-filter-layout");
  }, [isCatalogPage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);
        if (!response.ok) return;
        const data = await response.json();
        const list: PriceProduct[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const prices = list
          .map((product) => {
            const discounted = Number(product.discountedPrice ?? 0);
            const regular = Number(product.regularPrice ?? 0);
            return discounted > 0 ? discounted : regular;
          })
          .filter((price) => Number.isFinite(price) && price >= 0);
        if (!prices.length || cancelled) return;
        const floor = Math.floor(Math.min(...prices) * 100) / 100;
        const ceiling = Math.ceil(Math.max(...prices) * 100) / 100;
        setPriceFloor(floor);
        setPriceCeiling(Math.max(floor + 0.01, ceiling));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);
  useEffect(() => { setMinPrice(selectedMinPrice === null ? "" : String(selectedMinPrice)); }, [selectedMinPrice]);
  useEffect(() => { setMaxPrice(selectedMaxPrice === null ? "" : String(selectedMaxPrice)); }, [selectedMaxPrice]);
  useEffect(() => { setSelectedRating(selectedRatingProp ?? 0); }, [selectedRatingProp]);

  useEffect(() => {
    if (suppressInitialAutoApply && !didRunAutoApply.current) {
      didRunAutoApply.current = true;
      return;
    }
    didRunAutoApply.current = true;
    const timer = window.setTimeout(() => {
      onApplyFilters({
        search: searchInput.trim(),
        minPrice: minPrice === "" ? null : Number(minPrice),
        maxPrice: maxPrice === "" ? null : Number(maxPrice),
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, minPrice, maxPrice, suppressInitialAutoApply]);

  const handleClearFilters = () => {
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(0);
    onApplyFilters({ category: null, search: "", minPrice: null, maxPrice: null, rating: null });
  };

  const handleCategoryChange = (categoryId: string | null) => onApplyFilters({ category: categoryId });
  const handleRatingChange = (rating: number) => {
    const next = rating === selectedRating ? 0 : rating;
    setSelectedRating(next);
    onApplyFilters({ rating: next || null });
  };

  const hasAppliedFilters = Boolean(
    searchInput.trim() ||
    selectedCategory ||
    minPrice !== "" ||
    maxPrice !== "" ||
    selectedRating
  );

  const sliderMin = minPrice === "" ? priceFloor : Math.max(priceFloor, Math.min(Number(minPrice), priceCeiling));
  const sliderMax = maxPrice === "" ? priceCeiling : Math.min(priceCeiling, Math.max(Number(maxPrice), priceFloor));
  const range = Math.max(0.01, priceCeiling - priceFloor);
  const minPercent = ((sliderMin - priceFloor) / range) * 100;
  const maxPercent = ((sliderMax - priceFloor) / range) * 100;

  const euro = useMemo(
    () => new Intl.NumberFormat(isBg ? "bg-BG" : "en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }),
    [isBg]
  );

  const optionClass = (active: boolean) =>
    `flex h-12 w-full items-center rounded-2xl border px-4 text-left text-sm font-medium transition ${active ? "border-primary-200 bg-primary-50 text-primary-700" : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-100"}`;

  return (
    <aside className="w-full xl:w-72 xl:shrink-0 xl:self-start">
      <div className="box-border h-auto max-h-none w-full overflow-visible rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">{isBg ? "Филтриране" : "Filtering"}</p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">{isBg ? "Филтриране на продуктите" : "Refine the catalog"}</h2>
          </div>

          <div className="space-y-3">
            <div className="relative h-12">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={isBg ? "Търси продукти" : "Search products"} value={searchInput} onChange={e => setSearchInput(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
            </div>
            {hasAppliedFilters && <button type="button" onClick={handleClearFilters} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"><XMarkIcon className="h-5 w-5" /><span>{isBg ? "Изчисти филтрите" : "Clear filters"}</span></button>}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Ценови диапазон" : "Price range"}</h3>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500"><span>{euro.format(priceFloor)}</span><span>{euro.format(priceCeiling)}</span></div>
            <div className="relative h-7">
              <div className="absolute left-0 right-0 top-3 h-1 rounded-full bg-slate-200" />
              <div className="absolute top-3 h-1 rounded-full bg-[#18b99f]" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }} />
              <input aria-label={isBg ? "Минимална цена" : "Minimum price"} type="range" min={priceFloor} max={priceCeiling} step="0.01" value={sliderMin} onChange={e => { const next = Math.min(Number(e.target.value), sliderMax - 0.01); setMinPrice(next <= priceFloor ? "" : next.toFixed(2)); }} className="price-range-input absolute inset-x-0 top-0 z-20 h-7 w-full appearance-none bg-transparent" />
              <input aria-label={isBg ? "Максимална цена" : "Maximum price"} type="range" min={priceFloor} max={priceCeiling} step="0.01" value={sliderMax} onChange={e => { const next = Math.max(Number(e.target.value), sliderMin + 0.01); setMaxPrice(next >= priceCeiling ? "" : next.toFixed(2)); }} className="price-range-input absolute inset-x-0 top-0 z-30 h-7 w-full appearance-none bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">{euro.format(sliderMin)}</div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-700">{euro.format(sliderMax)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Рейтинг" : "Rating"}</h3>
            <div className="space-y-2">
              {ratingBuckets.map(rating => <button type="button" key={rating} onClick={() => handleRatingChange(rating)} className={optionClass(selectedRating === rating)}><span className="text-base tracking-[0.08em] text-amber-500">{"★".repeat(rating)}</span></button>)}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Категории" : "Categories"}</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => handleCategoryChange(null)} className={optionClass(!selectedCategory)}>{isBg ? "Всички категории" : "All categories"}</button>
              {categories.map(category => <button type="button" key={category.id} onClick={() => handleCategoryChange(category.id)} className={optionClass(selectedCategory === category.id)}>{category.name}</button>)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
