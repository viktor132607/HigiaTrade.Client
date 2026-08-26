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
  badgeBg: string;
  badgeEn: string;
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
    eyebrowBg: "Чистота за дома и бизнеса",
    eyebrowEn: "Cleaning for home and business",
    titleBg: "Почистващи препарати",
    titleEn: "Cleaning products",
    badgeBg: "АКТУАЛЕН КАТАЛОГ",
    badgeEn: "CURRENT CATALOG",
    noteBg: "Реални продукти, цени и наличности от каталога на HygiaTrade",
    noteEn: "Real products, prices and stock levels from the HygiaTrade catalog",
    ctaBg: "Към продуктите",
    ctaEn: "View products",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1200&q=80",
    accent: "from-teal-100 via-cyan-50 to-white",
  },
  {
    id: 2,
    eyebrowBg: "Ежедневна грижа",
    eyebrowEn: "Everyday care",
    titleBg: "Перилни препарати",
    titleEn: "Laundry detergents",
    badgeBg: "ЗА ДОМА",
    badgeEn: "FOR HOME",
    noteBg: "Продукти за бяло, цветно пране и ежедневна употреба",
    noteEn: "Products for white and colored laundry and everyday use",
    ctaBg: "Разгледай",
    ctaEn: "Browse",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80",
    accent: "from-sky-100 via-cyan-50 to-white",
  },
  {
    id: 3,
    eyebrowBg: "Професионална хигиена",
    eyebrowEn: "Professional hygiene",
    titleBg: "За бизнеса и офиса",
    titleEn: "For business and office",
    badgeBg: "ПРОФЕСИОНАЛНО",
    badgeEn: "PROFESSIONAL",
    noteBg: "Препарати и консумативи с ясни цени и актуални наличности",
    noteEn: "Cleaning products and supplies with clear prices and current stock",
    ctaBg: "Към каталога",
    ctaEn: "Open catalog",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    accent: "from-emerald-100 via-teal-50 to-white",
  },
];

const HomeHeroSlider = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex]);

  return (
    <section className="relative overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className={`relative min-h-[380px] bg-gradient-to-r ${activeSlide.accent} transition-colors sm:min-h-[430px] dark:from-slate-950 dark:via-slate-900 dark:to-black`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.85),transparent_25%),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.55),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        <img src={activeSlide.image} alt={isBg ? activeSlide.titleBg : activeSlide.titleEn} className="absolute inset-y-0 left-[30%] right-0 hidden h-full w-auto object-cover object-center opacity-80 md:block" />
        <div className="absolute inset-y-0 left-[30%] right-0 hidden bg-gradient-to-r from-transparent to-white/10 md:block dark:to-black/30" />

        <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)} className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:left-4" aria-label={isBg ? "Предишен слайд" : "Previous slide"}><ChevronLeftIcon className="h-5 w-5" /></button>
        <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % slides.length)} className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:right-4" aria-label={isBg ? "Следващ слайд" : "Next slide"}><ChevronRightIcon className="h-5 w-5" /></button>

        <div className="relative z-10 mx-auto flex max-w-7xl px-14 py-12 sm:px-16 sm:py-16 lg:px-8">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-teal-700 sm:text-xl dark:text-teal-300">{isBg ? activeSlide.eyebrowBg : activeSlide.eyebrowEn}</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">{isBg ? activeSlide.titleBg : activeSlide.titleEn}</h1>
            <span className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white dark:bg-white dark:text-black">{isBg ? activeSlide.badgeBg : activeSlide.badgeEn}</span>
            <p className="mt-6 max-w-lg text-sm font-semibold leading-6 text-slate-700 sm:mt-8 sm:text-lg dark:text-slate-200">{isBg ? activeSlide.noteBg : activeSlide.noteEn}</p>
            <Link to="/products" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-primary-600 sm:mt-8 sm:px-8 dark:bg-white dark:text-black dark:hover:bg-primary-200">{isBg ? activeSlide.ctaBg : activeSlide.ctaEn}</Link>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveIndex(index)} className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-10 bg-slate-950 dark:bg-white" : "w-2.5 bg-slate-500/40 dark:bg-white/40"}`} aria-label={`${isBg ? "Слайд" : "Slide"} ${index + 1}`} />)}
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSlider;
