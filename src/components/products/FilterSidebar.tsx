import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
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
  const isBg = language === "bg";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [minPrice, setMinPrice] = useState(selectedMinPrice === null ? "" : String(selectedMinPrice));
  const [maxPrice, setMaxPrice] = useState(selectedMaxPrice === null ? "" : String(selectedMaxPrice));
  const [selectedRating, setSelectedRating] = useState(selectedRatingProp ?? 0);
  const didRunAutoApply = useRef(false);

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

  const optionClass = (active: boolean) =>
    `flex h-12 w-full items-center rounded-2xl border px-4 text-left text-sm font-medium transition ${active ? "border-primary-200 bg-primary-50 text-primary-700" : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-slate-100"}`;

  return (
    <aside className="w-full xl:sticky xl:top-24 xl:w-72 xl:self-start">
      <div className="box-border w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.55)] sm:p-6 xl:h-[calc(100dvh-7rem)] xl:max-h-[760px] xl:min-h-[620px] xl:overflow-y-auto xl:overscroll-contain [scrollbar-gutter:stable]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">{isBg ? "Филтриране" : "Filtering"}</p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">{isBg ? "Филтриране на продуктите" : "Refine the catalog"}</h2>
            <p className="mt-2 text-sm text-slate-500">{isBg ? "Резултатите се обновяват автоматично при промяна на филтрите." : "Results update automatically as you change the filters."}</p>
          </div>

          <div className="space-y-3">
            <div className="relative h-12">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={isBg ? "Търси продукти" : "Search products"} value={searchInput} onChange={e => setSearchInput(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
            </div>
            <button type="button" onClick={handleClearFilters} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"><XMarkIcon className="h-5 w-5" /><span>{isBg ? "Изчисти филтрите" : "Clear filters"}</span></button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Ценови диапазон" : "Price range"}</h3>
            <div className="grid h-12 grid-cols-2 gap-3">
              <input type="number" min="0" step="0.01" inputMode="decimal" placeholder={isBg ? "Мин" : "Min"} value={minPrice} onChange={e => setMinPrice(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
              <input type="number" min="0" step="0.01" inputMode="decimal" placeholder={isBg ? "Макс" : "Max"} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Категории" : "Categories"}</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => handleCategoryChange(null)} className={optionClass(!selectedCategory)}>{isBg ? "Всички категории" : "All categories"}</button>
              {categories.map(category => <button type="button" key={category.id} onClick={() => handleCategoryChange(category.id)} className={optionClass(selectedCategory === category.id)}>{category.name}</button>)}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Рейтинг" : "Rating"}</h3>
            <div className="space-y-2">
              {ratingBuckets.map(rating => <button type="button" key={rating} onClick={() => handleRatingChange(rating)} className={optionClass(selectedRating === rating)}><span className="text-base tracking-[0.08em] text-amber-500">{"★".repeat(rating)}</span></button>)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
