import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

export interface HomeSlide {
  id: string;
  order: number;
  isActive: boolean;
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
  ctaUrl: string;
  image: string;
  accent: string;
}

export interface HomeSlideshowPayload {
  slides: HomeSlide[];
}

const HomeHeroSlider = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadSlides = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/home-slideshow`, { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setSlides([]);
          return;
        }

        const payload = (await response.json()) as HomeSlideshowPayload;
        const nextSlides = Array.isArray(payload?.slides)
          ? payload.slides
              .filter((slide) => slide?.isActive !== false)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : [];

        if (!cancelled) {
          setSlides(nextSlides);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) setSlides([]);
      }
    };

    void loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % slides.length),
      5000
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  const activeSlide = useMemo(() => slides[activeIndex] ?? slides[0] ?? null, [activeIndex, slides]);
  const canNavigate = slides.length > 1;

  const renderSlideContent = (slide: HomeSlide, index: number) => {
    const active = index === activeIndex;
    const eyebrow = isBg ? slide.eyebrowBg : slide.eyebrowEn;
    const title = isBg ? slide.titleBg : slide.titleEn;
    const badge = isBg ? slide.badgeBg : slide.badgeEn;
    const note = isBg ? slide.noteBg : slide.noteEn;
    const cta = isBg ? slide.ctaBg : slide.ctaEn;
    const slotState = active
      ? "visible opacity-100"
      : "invisible pointer-events-none opacity-0";

    return (
      <div key={slide.id} className="contents" aria-hidden={!active}>
        <div className={`col-start-1 row-start-1 transition-opacity duration-300 ${slotState}`}>
          {Boolean(eyebrow) && (
            <p className="text-sm font-semibold text-teal-700 sm:text-xl dark:text-teal-300">
              {eyebrow}
            </p>
          )}
        </div>

        <div className={`col-start-1 row-start-2 pt-3 transition-opacity duration-300 ${slotState}`}>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            {title}
          </h1>
        </div>

        <div className={`col-start-1 row-start-3 pt-5 transition-opacity duration-300 ${slotState}`}>
          {Boolean(badge) && (
            <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white dark:bg-white dark:text-black">
              {badge}
            </span>
          )}
        </div>

        <div className={`col-start-1 row-start-4 pt-6 transition-opacity duration-300 sm:pt-8 ${slotState}`}>
          {Boolean(note) && (
            <p className="max-w-lg text-sm font-semibold leading-6 text-slate-700 sm:text-lg dark:text-slate-200">
              {note}
            </p>
          )}
        </div>

        <div className={`col-start-1 row-start-5 pt-6 transition-opacity duration-300 sm:pt-8 ${slotState}`}>
          {Boolean(cta) && (
            <Link
              to={slide.ctaUrl || "/products"}
              tabIndex={active ? 0 : -1}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-primary-600 sm:px-8 dark:bg-white dark:text-black dark:hover:bg-primary-200"
            >
              {cta}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (!activeSlide) return null;

  return (
    <section className="relative overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className={`relative min-h-[380px] bg-gradient-to-r ${activeSlide.accent || "from-teal-100 via-cyan-50 to-white"} transition-colors sm:min-h-[430px] dark:from-slate-950 dark:via-slate-900 dark:to-black`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.85),transparent_25%),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.55),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        {activeSlide.image && (
          <img
            src={activeSlide.image}
            alt={isBg ? activeSlide.titleBg : activeSlide.titleEn}
            className="absolute inset-y-0 left-[30%] right-0 hidden h-full w-auto object-cover object-center opacity-80 md:block"
          />
        )}
        <div className="absolute inset-y-0 left-[30%] right-0 hidden bg-gradient-to-r from-transparent to-white/10 md:block dark:to-black/30" />

        {canNavigate && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
              className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:left-4"
              aria-label={isBg ? "Предишен слайд" : "Previous slide"}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
              className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:right-4"
              aria-label={isBg ? "Следващ слайд" : "Next slide"}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="relative z-10 mx-auto flex max-w-7xl px-14 py-12 sm:px-16 sm:py-16 lg:px-8">
          <div className="grid w-full max-w-xl grid-cols-1 grid-rows-[auto_auto_auto_auto_auto]">
            {slides.map(renderSlideContent)}
          </div>
        </div>

        {canNavigate && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-10 bg-slate-950 dark:bg-white" : "w-2.5 bg-slate-500/40 dark:bg-white/40"}`}
                aria-label={`${isBg ? "Слайд" : "Slide"} ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeHeroSlider;
