import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Slide {
  id: number;
  eyebrowBg: string;
  eyebrowEn: string;
  titleBg: string;
  titleEn: string;
  discount: string;
  noteBg: string;
  noteEn: string;
  ctaBg: string;
  ctaEn: string;
  image: string;
  accent: string;
}

const slides: Slide[] = [
  {
    id: 1,
    eyebrowBg: "Големи оферти за чист дом",
    eyebrowEn: "Big offers for a clean home",
    titleBg: "Майски оферти",
    titleEn: "May offers",
    discount: "-40%",
    noteBg: "Почистващи препарати и консумативи за дома и офиса",
    noteEn: "Cleaning products and supplies for home and office",
    ctaBg: "Купи сега",
    ctaEn: "Shop now",
    image:
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1200&q=80",
    accent: "from-pink-200 via-rose-100 to-emerald-100",
  },
  {
    id: 2,
    eyebrowBg: "Професионална грижа",
    eyebrowEn: "Professional care",
    titleBg: "Перилни препарати",
    titleEn: "Laundry detergents",
    discount: "-25%",
    noteBg: "За бяло, цветно пране и ежедневна употреба",
    noteEn: "For white, color laundry and everyday use",
    ctaBg: "Разгледай",
    ctaEn: "Browse",
    image:
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80",
    accent: "from-sky-200 via-cyan-100 to-white",
  },
  {
    id: 3,
    eyebrowBg: "За бизнеса и офиса",
    eyebrowEn: "For business and office",
    titleBg: "Консумативи на склад",
    titleEn: "Supplies in stock",
    discount: "ТОП",
    noteBg: "Подбрани артикули с ясни цени и наличности",
    noteEn: "Selected items with clear prices and stock levels",
    ctaBg: "Към продуктите",
    ctaEn: "View products",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    accent: "from-amber-200 via-orange-100 to-white",
  },
];

const HomeHeroSlider = () => {
  const { language } = useLanguageTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex]);

  const previousSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <section className="relative overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div
        className={`relative min-h-[360px] bg-gradient-to-r ${activeSlide.accent} transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-black`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.85),transparent_25%),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.55),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        <img
          src={activeSlide.image}
          alt={language === "bg" ? activeSlide.titleBg : activeSlide.titleEn}
          className="absolute inset-y-0 right-0 hidden h-full w-3/5 object-cover opacity-80 md:block"
        />
        <div className="absolute inset-y-0 right-0 hidden w-3/5 bg-gradient-to-r from-transparent to-white/10 md:block dark:to-black/30" />

        <button
          type="button"
          onClick={previousSlide}
          className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>

        <div className="relative z-10 mx-auto flex max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xl font-semibold text-rose-600 dark:text-rose-300">
              {language === "bg" ? activeSlide.eyebrowBg : activeSlide.eyebrowEn}
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-slate-950 sm:text-7xl dark:text-white">
              {language === "bg" ? activeSlide.titleBg : activeSlide.titleEn}
            </h1>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-bold text-slate-950 dark:text-white">
                {language === "bg" ? "до" : "up to"}
              </span>
              <span className="font-display text-7xl font-black leading-none text-lime-700 sm:text-8xl dark:text-lime-300">
                {activeSlide.discount}
              </span>
            </div>
            <p className="mt-8 max-w-2xl text-lg font-semibold text-slate-700 dark:text-slate-200">
              {language === "bg" ? activeSlide.noteBg : activeSlide.noteEn}
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex rounded-xl bg-slate-950 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-primary-600 dark:bg-white dark:text-black dark:hover:bg-primary-200"
            >
              {language === "bg" ? activeSlide.ctaBg : activeSlide.ctaEn}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                activeIndex === index
                  ? "w-10 bg-slate-950 dark:bg-white"
                  : "w-2.5 bg-slate-500/40 dark:bg-white/40"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSlider;
