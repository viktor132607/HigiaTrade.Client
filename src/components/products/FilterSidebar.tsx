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

const ratingBuckets = [
  { value: 5, stars: "★★★★★", rangeBg: "4,50 – 5,00", rangeEn: "4.50 – 5.00" },
  { value: 4, stars: "★★★★", rangeBg: "3,50 – 4,49", rangeEn: "3.50 – 4.49" },
  { value: 3, stars: "★★★", rangeBg: "2,50 – 3,49", rangeEn: "2.50 – 3.49" },
  { value: 2, stars: "★★", rangeBg: "1,50 – 2,49", rangeEn: "1.50 – 2.49" },
  { value: 1, stars: "★", rangeBg: "1,00 – 1,49", rangeEn: "1.00 – 1.49" },
];

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
    setSearchInput(""); setMinPrice(""); setMaxPrice(""); setSelectedRating(0);
    onApplyFilters({ category:null, search:"", minPrice:null, maxPrice:null, rating:null });
  };
  const handleCategoryChange = (categoryId: string | null) => onApplyFilters({ category: categoryId });
  const handleRatingChange = (rating: number) => {
    const newRating = rating === selectedRating ? 0 : rating;
    setSelectedRating(newRating);
    onApplyFilters({ rating: newRating || null });
  };

  return (
    <aside className="w-full xl:sticky xl:top-24 xl:w-72 xl:self-start">
      <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.55)] sm:p-6 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:overscroll-contain [scrollbar-gutter:stable]">
        <div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">{isBg ? "Филтриране" : "Filtering"}</p><h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">{isBg ? "Филтриране на продуктите" : "Refine the catalog"}</h2><p className="mt-2 text-sm text-slate-500">{isBg ? "Резултатите се обновяват автоматично при промяна на филтрите." : "Results update automatically as you change the filters."}</p></div>
        <div className="space-y-3"><div className="relative"><MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input type="text" placeholder={isBg?"Търси продукти":"Search products"} value={searchInput} onChange={e=>setSearchInput(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"/></div><button type="button" onClick={handleClearFilters} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"><XMarkIcon className="h-5 w-5"/><span>{isBg?"Изчисти филтрите":"Clear filters"}</span></button></div>
        <div className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg?"Ценови диапазон":"Price range"}</h3><div className="grid grid-cols-2 gap-3"><input type="number" min="0" step="0.01" inputMode="decimal" placeholder={isBg?"Мин":"Min"} value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"/><input type="number" min="0" step="0.01" inputMode="decimal" placeholder={isBg?"Макс":"Max"} value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"/></div></div>
        <div className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg?"Категории":"Categories"}</h3><div className="space-y-2"><button type="button" onClick={()=>handleCategoryChange(null)} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${!selectedCategory?"bg-primary-50 text-primary-700":"bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>{isBg?"Всички категории":"All categories"}</button>{categories.map(category=><button type="button" key={category.id} onClick={()=>handleCategoryChange(category.id)} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${selectedCategory===category.id?"bg-primary-50 text-primary-700":"bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>{category.name}</button>)}</div></div>
        <div className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg?"Рейтинг":"Rating"}</h3><div className="space-y-2">{ratingBuckets.map(bucket=><button type="button" key={bucket.value} onClick={()=>handleRatingChange(bucket.value)} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${selectedRating===bucket.value?"bg-primary-50 text-primary-700":"bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}><span className="block text-amber-500">{bucket.stars}</span><span className="mt-0.5 block text-xs text-slate-500">{isBg?bucket.rangeBg:bucket.rangeEn}</span></button>)}</div></div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
