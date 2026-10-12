import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import ProductCard from "../products/ProductCard";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Product = ComponentProps<typeof ProductCard>["product"];

type Props = {
  products: Product[];
  label: string;
  className?: string;
};

export default function HomeProductCarousel({ products, label, className = "" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollBack(track.scrollLeft > 2);
    setCanScrollForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [products.length, updateArrows]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const first = track.firstElementChild as HTMLElement | null;
    const second = first?.nextElementSibling as HTMLElement | null;
    const distance = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-label={isBg ? `Предишни продукти: ${label}` : `Previous products: ${label}`}
        disabled={!canScrollBack}
        onClick={() => move(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition hover:border-[#18b99f] hover:text-[#18b99f] disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:h-11 sm:w-11"
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onScroll={updateArrows}
        className="home-product-carousel__track mx-10 sm:mx-12"
      >
        {products.map((product) => (
          <div key={product.id} className="home-product-carousel__item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label={isBg ? `Следващи продукти: ${label}` : `Next products: ${label}`}
        disabled={!canScrollForward}
        onClick={() => move(1)}
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition hover:border-[#18b99f] hover:text-[#18b99f] disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:h-11 sm:w-11"
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
