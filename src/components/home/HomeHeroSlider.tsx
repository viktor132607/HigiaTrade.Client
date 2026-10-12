import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { getPreloadedHomeSlideshow, preloadHomeSlideshow } from "../../utils/homeSlideshowPreload";

export type SlideField = "eyebrow" | "title" | "badge" | "note" | "cta";
export type SlidePosition = { x: number; y: number };
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
  imagePositionY?: number;
  imageLightening?: number;
  accent: string;
  positions?: Partial<Record<SlideField, SlidePosition>>;
}

export interface HomeSlideshowPayload {
  slideDurationSeconds?: number;
  slides: HomeSlide[];
}

export type PreviewConfig = { slide: HomeSlide; index: number; total: number; onMove: (key: SlideField, pos: SlidePosition) => void };
const HomeHeroSlider = ({ preview }: { preview?: PreviewConfig } = {}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousSlide, setPreviousSlide] = useState<HomeSlide | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDurationSeconds, setSlideDurationSeconds] = useState(5);
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;

    const loadSlides = async () => {
      try {
        const payload = (
          getPreloadedHomeSlideshow() ??
          await preloadHomeSlideshow()
        ) as HomeSlideshowPayload | null;

        if (!payload) {
          if (!cancelled) setSlides([]);
          return;
        }

        const nextSlides = Array.isArray(payload?.slides)
          ? payload.slides
              .filter((slide) => slide?.isActive !== false)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : [];

        if (!cancelled) {
          setSlides(nextSlides);
          setPreviousSlide(null);
          setIsTransitioning(false);
          setImagesReady(true);
          setSlideDurationSeconds(
            Number.isFinite(payload?.slideDurationSeconds) && (payload.slideDurationSeconds ?? 0) > 0
              ? Math.min(60, Math.max(1, payload.slideDurationSeconds as number))
              : 5
          );
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
  }, [Boolean(preview)]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  const activeSlide = useMemo(() => preview?.slide ?? slides[activeIndex] ?? slides[0] ?? null, [activeIndex, slides, preview]);
  const canNavigate = preview ? preview.total > 1 : slides.length > 1;

  const showSlide = useCallback((nextIndex: number, nextDirection: "next" | "previous") => {
    if (!slides.length || nextIndex === activeIndex) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setDirection(nextDirection);
    setPreviousSlide(reduceMotion ? null : activeSlide);
    setIsTransitioning(!reduceMotion);
    setActiveIndex(nextIndex);
  }, [activeIndex, activeSlide, slides.length]);

  useEffect(() => {
    if (preview || slides.length <= 1 || !imagesReady) return;

    const timer = window.setInterval(() => {
      showSlide((activeIndex + 1) % slides.length, "next");
    }, slideDurationSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [activeIndex, imagesReady, showSlide, slideDurationSeconds, slides.length, Boolean(preview)]);

  useEffect(() => {
    if (!isTransitioning) return;

    const timer = window.setTimeout(() => {
      setPreviousSlide(null);
      setIsTransitioning(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isTransitioning]);


  const onEditorPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!preview || !frame) return;
    const element = (event.target as Element).closest<HTMLElement>("[data-hero-field]");
    if (!element || !frame.contains(element)) return;
    const key = element.dataset.heroField as SlideField;
    if (!(["eyebrow", "title", "badge", "note", "cta"] as string[]).includes(key)) return;
    event.preventDefault();
    const elRect = element.getBoundingClientRect();
    const offsetX = event.clientX - elRect.left, offsetY = event.clientY - elRect.top;
    const move = (e: PointerEvent) => {
      const f = frame.getBoundingClientRect();
      if (!f.width || !f.height) return;
      const x = 100 * (e.clientX - f.left - offsetX) / f.width;
      const y = 100 * (e.clientY - f.top - offsetY) / f.height;
      preview.onMove(key, {
        x: Math.round(Math.max(0, Math.min(100 * (f.width - elRect.width) / f.width, x)) * 100) / 100,
        y: Math.round(Math.max(0, Math.min(100 * (f.height - elRect.height) / f.height, y)) * 100) / 100,
      });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const contentByField = (slide: HomeSlide, field: SlideField) => {
    const value = (bg: string, en: string) => isBg ? bg : en;
    switch (field) {
      case "eyebrow": return <p className="text-sm font-semibold text-teal-700 sm:text-xl dark:text-teal-300">{value(slide.eyebrowBg, slide.eyebrowEn)}</p>;
      case "title": return <h1 className="max-w-xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">{value(slide.titleBg, slide.titleEn)}</h1>;
      case "badge": return <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white dark:bg-white dark:text-black">{value(slide.badgeBg, slide.badgeEn)}</span>;
      case "note": return <p className="max-w-lg text-sm font-semibold leading-6 text-slate-700 sm:text-lg dark:text-slate-200">{value(slide.noteBg, slide.noteEn)}</p>;
      case "cta": return <Link to={slide.ctaUrl || "/products"} onClick={preview ? e => e.preventDefault() : undefined} tabIndex={preview ? -1 : 0} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white sm:px-8 dark:bg-white dark:text-black">{value(slide.ctaBg, slide.ctaEn)}</Link>;
    }
  };

  const renderSlideContent = (slide: HomeSlide, index: number) => {
    const active = preview ? true : index === activeIndex;
    const eyebrow = isBg ? slide.eyebrowBg : slide.eyebrowEn;
    const title = isBg ? slide.titleBg : slide.titleEn;
    const badge = isBg ? slide.badgeBg : slide.badgeEn;
    const note = isBg ? slide.noteBg : slide.noteEn;
    const cta = isBg ? slide.ctaBg : slide.ctaEn;
    const slotState = active
      ? "visible opacity-100 home-hero-copy-enter"
      : "invisible pointer-events-none opacity-0";

    return (
      <div key={slide.id} className="contents" aria-hidden={!active}>
        <div data-hero-field="eyebrow" className={`col-start-1 row-start-1 transition-opacity duration-300 ${slotState} ${slide.positions?.eyebrow ? "invisible pointer-events-none" : ""} ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
          {Boolean(eyebrow) && (
            <p className="text-sm font-semibold text-teal-700 sm:text-xl dark:text-teal-300">
              {eyebrow}
            </p>
          )}
        </div>

        <div data-hero-field="title" className={`col-start-1 row-start-2 pt-3 transition-opacity duration-300 ${slotState} ${slide.positions?.title ? "invisible pointer-events-none" : ""} ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
          <h1 className="font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            {title}
          </h1>
        </div>

        <div data-hero-field="badge" className={`col-start-1 row-start-3 pt-5 transition-opacity duration-300 ${slotState} ${slide.positions?.badge ? "invisible pointer-events-none" : ""} ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
          {Boolean(badge) && (
            <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white dark:bg-white dark:text-black">
              {badge}
            </span>
          )}
        </div>

        <div data-hero-field="note" className={`col-start-1 row-start-4 pt-6 transition-opacity duration-300 sm:pt-8 ${slotState} ${slide.positions?.note ? "invisible pointer-events-none" : ""} ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
          {Boolean(note) && (
            <p className="max-w-lg text-sm font-semibold leading-6 text-slate-700 sm:text-lg dark:text-slate-200">
              {note}
            </p>
          )}
        </div>

        <div data-hero-field="cta" className={`col-start-1 row-start-5 pt-6 transition-opacity duration-300 sm:pt-8 ${slotState} ${slide.positions?.cta ? "invisible pointer-events-none" : ""} ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
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
      <div ref={frameRef} onPointerDown={onEditorPointerDown} className={`home-hero-frame relative mx-auto w-full max-w-[2560px] aspect-[256/55] bg-gradient-to-r ${activeSlide.accent || "from-teal-100 via-cyan-50 to-white"} transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-black`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.85),transparent_25%),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.55),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_30%)]" />
        {previousSlide?.image && isTransitioning && (
          <img
            src={previousSlide.image}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 hidden h-full w-full object-cover md:block ${direction === "next" ? "home-hero-slide-out-left" : "home-hero-slide-out-right"}`}
            style={{ objectPosition: `center ${previousSlide.imagePositionY ?? 50}%` }}
          />
        )}
        {activeSlide.image && (
          <img
            key={`${activeSlide.id}-${activeIndex}`}
            src={activeSlide.image}
            alt={isBg ? activeSlide.titleBg : activeSlide.titleEn}
            loading="eager"
            fetchPriority="high"
            className={`absolute inset-0 hidden h-full w-full object-cover md:block ${isTransitioning ? direction === "next" ? "home-hero-slide-in-right" : "home-hero-slide-in-left" : ""}`}
            style={{ objectPosition: `center ${activeSlide.imagePositionY ?? 50}%` }}
          />
        )}
        <div
          className="absolute inset-0 hidden bg-gradient-to-r from-white/55 via-white/10 to-transparent md:block dark:from-black/55 dark:via-black/10 dark:to-transparent"
          style={{ opacity: Math.min(100, Math.max(0, activeSlide.imageLightening ?? 100)) / 100 }}
        />

        {canNavigate && (
          <>
            <button
              type="button"
              onClick={preview ? undefined : () => showSlide((activeIndex - 1 + slides.length) % slides.length, "previous")}
              className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:left-4"
              aria-label={isBg ? "Предишен слайд" : "Previous slide"}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={preview ? undefined : () => showSlide((activeIndex + 1) % slides.length, "next")}
              className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow transition hover:bg-white sm:right-4"
              aria-label={isBg ? "Следващ слайд" : "Next slide"}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="home-hero-content relative z-10 mx-auto flex max-w-7xl px-14 py-12 sm:px-16 sm:py-16 lg:px-8">
          <div className="home-hero-copy grid w-full max-w-xl grid-cols-1 grid-rows-[auto_auto_auto_auto_auto]">
            {(preview ? [preview.slide] : slides).map(renderSlideContent)}
          </div>
        </div>


        {activeSlide && (["eyebrow", "title", "badge", "note", "cta"] as SlideField[]).map(field => {
          const pos = activeSlide.positions?.[field];
          const visible = field === "eyebrow" ? (isBg ? activeSlide.eyebrowBg : activeSlide.eyebrowEn)
            : field === "title" ? (isBg ? activeSlide.titleBg : activeSlide.titleEn)
            : field === "badge" ? (isBg ? activeSlide.badgeBg : activeSlide.badgeEn)
            : field === "note" ? (isBg ? activeSlide.noteBg : activeSlide.noteEn)
            : (isBg ? activeSlide.ctaBg : activeSlide.ctaEn);
          return pos && visible ? <div key={field} data-hero-field={field}
            className={`absolute z-[15] max-w-[min(35rem,90%)] ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>{contentByField(activeSlide, field)}</div> : null;
        })}
        {preview && <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center gap-2 px-3">
          {[isBg ? "Най-продавани" : "Best sellers", isBg ? "Последно добавени" : "Recently added", isBg ? "Най-висок рейтинг" : "Highest rating"].map((label, i) =>
            <span key={label} className={`min-h-10 rounded-full px-4 py-2 text-xs font-bold uppercase sm:px-6 ${i === 0 ? "bg-orange-500 text-white" : "bg-slate-800 text-white"}`}>{label}</span>)}
        </div>}
        {canNavigate && (
          <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {(preview ? Array.from({ length: preview.total }, (_, index) => ({ id: String(index) })) : slides).map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={preview ? undefined : () => showSlide(index, index > activeIndex ? "next" : "previous")}
                className={`h-2.5 rounded-full transition-all ${(preview ? preview.index : activeIndex) === index ? "w-10 bg-slate-950 dark:bg-white" : "w-2.5 bg-slate-500/40 dark:bg-white/40"}`}
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
