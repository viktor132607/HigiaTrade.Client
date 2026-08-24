import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Category {
  id: string;
  name: string;
}

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  onApplyFilters: (filters: {
    category?: string | null;
    search?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    rating?: number | null;
  }) => void;
}

const FilterSidebar = ({
  categories,
  selectedCategory,
  searchQuery,
  onApplyFilters,
}: FilterSidebarProps) => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  const handleApplyAllFilters = () => {
    onApplyFilters({
      search: searchInput.trim(),
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      rating: selectedRating || null,
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(0);
    onApplyFilters({
      category: null,
      search: "",
      minPrice: null,
      maxPrice: null,
      rating: null,
    });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    onApplyFilters({ category: categoryId });
  };

  const handleRatingChange = (rating: number) => {
    const newRating = rating === selectedRating ? 0 : rating;
    setSelectedRating(newRating);
    onApplyFilters({ rating: newRating || null });
  };

  return (
    <aside className="w-full xl:sticky xl:top-24 xl:w-72 xl:self-start">
      <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.55)] sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Filters</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">Refine the catalog</h2>
          <p className="mt-2 text-sm text-slate-500">Search by name and narrow the product list by category, price, and rating.</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={handleApplyAllFilters}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
            >
              <XMarkIcon className="h-5 w-5" />
              <span>Clear filters</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Price range</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Categories</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                !selectedCategory
                  ? "bg-primary-50 text-primary-700"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {isBg ? "Всички категории" : "All categories"}
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  selectedCategory === category.id
                    ? "bg-primary-50 text-primary-700"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Rating</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                type="button"
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  selectedRating === rating
                    ? "bg-primary-50 text-primary-700"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {Array(rating).fill("★").join("")} & up
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
