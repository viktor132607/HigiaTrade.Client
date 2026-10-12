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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [arrowCenter, setArrowCenter] = useState<number | null>(null);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const updateLayout = useCallback(() => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    setHasOverflow(track.scrollWidth > track.clientWidth + 2);
    // Anchor navigation to the actual scaled product card, not to the track's
    // large top/bottom padding for shadows and focus outlines.
    const card = track.querySelector<HTMLElement>(".home-product-carousel__item article");
    if (card) {
      const cardBox = card.getBoundingClientRect();
      const wrapperBox = wrapper.getBoundingClientRect();
      setArrowCenter(cardBox.top + cardBox.height / 2 - wrapperBox.top);
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(track);
    const firstCard = track.querySelector(".home-product-carousel__item article");
    if (firstCard) observer.observe(firstCard);
    window.addEventListener("resize", updateLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, [products.length, updateLayout]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track || !hasOverflow) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    // After the last card, continue again from the beginning (and vice versa).
    if (direction > 0 && track.scrollLeft >= maxScroll - 2) {
      track.scrollTo({ left: 0, behavior: "auto" });
    } else if (direction < 0 && track.scrollLeft <= 2) {
      track.scrollTo({ left: maxScroll, behavior: "auto" });
    } else {
      const first = track.firstElementChild as HTMLElement | null;
      const second = first?.nextElementSibling as HTMLElement | null;
      const step = first && second ? second.offsetLeft - first.offsetLeft : track.clientWidth;
      track.scrollBy({ left: direction * step, behavior: "smooth" });
    }
  };

  const arrowClasses = "absolute z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-md transition hover:border-[#18b99f] hover:text-[#18b99f] disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:h-11 sm:w-11";
  const arrowStyle = { top: arrowCenter === null ? "50%" : `${arrowCenter}px` };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={isBg ? `Предишни продукти: ${label}` : `Previous products: ${label}`}
        disabled={!hasOverflow}
        onClick={() => move(-1)}
        style={arrowStyle}
        className={`left-0 ${arrowClasses}`}
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
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
        disabled={!hasOverflow}
        onClick={() => move(1)}
        style={arrowStyle}
        className={`right-0 ${arrowClasses}`}
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
