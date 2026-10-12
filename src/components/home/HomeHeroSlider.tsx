import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { getPreloadedHomeSlideshow, preloadHomeSlideshow } from "../../utils/homeSlideshowPreload";

export type LegacySlideField = "eyebrow" | "title" | "badge" | "note" | "cta";
export type SlideField = LegacySlideField | `extra:${string}`;
export type HeroOverlayElement = {
  id: string;
  kind: "text" | "button";
  textBg: string;
  textEn: string;
  url: string;
  color: string;
  background: string;
  fontSize: number;
};
export type SlidePosition = { x: number; y: number; scale?: number };
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
  elements?: HeroOverlayElement[];
}

export interface HomeSlideshowPayload {
  slideDurationSeconds?: number;
  slides: HomeSlide[];
}

export type PreviewConfig = {
  slide: HomeSlide;
  index: number;
  total: number;
  selected?: SlideField | null;
  snapEnabled?: boolean;
  fullPage?: boolean;
  onSelect?: (key: SlideField) => void;
  onMove: (key: SlideField, pos: SlidePosition) => void;
};
const HomeHeroSlider = ({ preview }: { preview?: PreviewConfig } = {}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [snapGuide, setSnapGuide] = useState<{ x?: number; y?: number }>({});
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
    if (!preview || !frame || event.button !== 0) return;
    const node = (event.target as Element).closest<HTMLElement>("[data-hero-field]");
    if (!node || !frame.contains(node)) return;
    const field = node.dataset.heroField as SlideField;
    if (!(["eyebrow", "title", "badge", "note", "cta"] as string[]).includes(field) && !field.startsWith("extra:")) return;

    event.preventDefault();
    preview.onSelect?.(field);
    const resizing = Boolean((event.target as Element).closest("[data-scale-handle]"));
    const frameRect = frame.getBoundingClientRect();
    // Default grid rows have padding. Measure their content, not the row,
    // so the first selection doesn't jump when it becomes positioned.
    const content = preview.slide.positions?.[field] ? node : node.firstElementChild as HTMLElement | null;
    const rect = (content ?? node).getBoundingClientRect();
    const existing = preview.slide.positions?.[field];
    const scale = existing?.scale ?? 1;
    const initial = existing ?? {
      x: 100 * (rect.left - frameRect.left) / frameRect.width,
      y: 100 * (rect.top - frameRect.top) / frameRect.height,
      scale,
    };
    const first = {
      x: Math.max(0, initial.x),
      y: Math.max(0, initial.y),
      scale,
    };
    if (!existing) preview.onMove(field, first);

    const xStart = event.clientX;
    const yStart = event.clientY;
    const targetW = rect.width / frameRect.width * 100;
    const targetH = rect.height / frameRect.height * 100;
    let latest = first;

    const snap = (value: number, length: number, axis: "x" | "y") => {
      const size = axis === "x" ? frameRect.width : frameRect.height;
      const anchors: number[] = [0, 5, 50, 95, 100];
      for (const other of frame.querySelectorAll<HTMLElement>("[data-hero-field]")) {
        if (other === node || other.dataset.heroField === field) continue;
        if (window.getComputedStyle(other).visibility === "hidden") continue;
        const box = other.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        const beginning = axis === "x" ? box.left - frameRect.left : box.top - frameRect.top;
        const measure = axis === "x" ? box.width : box.height;
        anchors.push(100 * beginning / size, 100 * (beginning + measure / 2) / size, 100 * (beginning + measure) / size);
      }

      let closest: { left: number; guide: number; distance: number } | null = null;
      for (const guide of anchors) {
        for (const fraction of [0, 0.5, 1]) {
          const possibleLeft = guide - fraction * length;
          const distance = Math.abs(possibleLeft - value) * size / 100;
          if (distance <= 10 && (!closest || distance < closest.distance)) {
            closest = { left: possibleLeft, guide, distance };
          }
        }
      }
      return closest;
    };

    const move = (pointer: PointerEvent) => {
      const bounds = frame.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      if (resizing) {
        const delta = (pointer.clientX - xStart) / Math.max(rect.width, 24);
        const increment = (pointer.clientY - yStart) / Math.max(rect.height, 24);
        const desired = Math.round(Math.max(0.5, Math.min(2.5, scale * (1 + delta + increment / 2))) * 20) / 20;
        const originalWidth = targetW / scale;
        const originalHeight = targetH / scale;
        const allowableX = (100 - first.x) / Math.max(originalWidth, 1);
        const allowableY = (100 - first.y) / Math.max(originalHeight, 1);
        const nextScale = Math.max(0.5, Math.min(desired, allowableX, allowableY));
        latest = { ...first, scale: nextScale };
        setSnapGuide({});
      } else {
        let x = first.x + 100 * (pointer.clientX - xStart) / bounds.width;
        let y = first.y + 100 * (pointer.clientY - yStart) / bounds.height;
        const guideX = preview.snapEnabled !== false ? snap(x, targetW, "x") : null;
        const guideY = preview.snapEnabled !== false ? snap(y, targetH, "y") : null;
        if (guideX) x = guideX.left;
        if (guideY) y = guideY.left;
        const maxX = Math.max(0, 100 - targetW);
        const maxY = Math.max(0, 100 - targetH);
        latest = {
          x: Math.round(Math.max(0, Math.min(maxX, x)) * 100) / 100,
          y: Math.round(Math.max(0, Math.min(maxY, y)) * 100) / 100,
          scale,
        };
        setSnapGuide({
          x: guideX?.guide,
          y: guideY?.guide,
        });
      }
      preview.onMove(field, latest);
    };
    const finish = () => {
      setSnapGuide({});
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const contentByField = (slide: HomeSlide, field: SlideField) => {
    if (field.startsWith("extra:")) {
      const element = slide.elements?.find(item => item.id === field.slice(6));
      if (!element) return null;
      const content = isBg ? element.textBg : element.textEn || element.textBg;
      if (element.kind === "button") {
        return <Link to={element.url || "/products"} onClick={preview ? event => event.preventDefault() : undefined}
          className="inline-flex min-h-10 items-center justify-center rounded-lg px-5 py-2 font-bold shadow-sm"
          style={{ color: element.color || "#ffffff", backgroundColor: element.background || "#0f172a", fontSize: element.fontSize || 16 }}>
          {content}
        </Link>;
      }
      return <span className="block whitespace-pre-line font-bold leading-tight" style={{ fontSize: element.fontSize || 24, color: element.color || "#0f172a" }}>{content}</span>;
    }
    const value = (bg: string, en: string) => isBg ? bg : en;
    switch (field) {
      case "eyebrow": return <p className="text-sm font-semibold text-teal-700 sm:text-xl dark:text-teal-300">{value(slide.eyebrowBg, slide.eyebrowEn)}</p>;
      case "title": return <h1 className="max-w-xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">{value(slide.titleBg, slide.titleEn)}</h1>;
      case "badge": return <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white dark:bg-white dark:text-black">{value(slide.badgeBg, slide.badgeEn)}</span>;
      case "note": return <p className="max-w-lg text-sm font-semibold leading-6 text-slate-700 sm:text-lg dark:text-slate-200">{value(slide.noteBg, slide.noteEn)}</p>;
      case "cta": return <Link to={slide.ctaUrl || "/products"} onClick={preview ? e => e.preventDefault() : undefined} tabIndex={preview ? -1 : 0} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-primary-600 sm:px-8 dark:bg-white dark:text-black dark:hover:bg-primary-200">{value(slide.ctaBg, slide.ctaEn)}</Link>;
    }
  };

  const renderSlideContent = (slide: HomeSlide, index: number) => {
    if (preview ? false : index !== activeIndex) return null;

    const labels: Record<LegacySlideField, string> = {
      eyebrow: isBg ? slide.eyebrowBg : slide.eyebrowEn,
      title: isBg ? slide.titleBg : slide.titleEn,
      badge: isBg ? slide.badgeBg : slide.badgeEn,
      note: isBg ? slide.noteBg : slide.noteEn,
      cta: isBg ? slide.ctaBg : slide.ctaEn,
    };

    // Do not reserve space for empty or freely positioned fields.
    // Only actual visible text/button nodes form the default vertical stack.
    return (
      <div key={slide.id} className="contents">
        {(["eyebrow", "title", "badge", "note", "cta"] as LegacySlideField[])
          .filter(field => Boolean(labels[field]) && !slide.positions?.[field])
          .map(field => (
            <div key={field} data-hero-field={field}
              className={`w-fit max-w-full ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""}`}>
              {contentByField(slide, field)}
            </div>
          ))}
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
          <div className="home-hero-copy flex w-full max-w-xl flex-col items-start gap-3 sm:gap-4">
            {(preview ? [preview.slide] : slides).map(renderSlideContent)}
          </div>
        </div>


        {activeSlide && ([
          "eyebrow", "title", "badge", "note", "cta",
          ...(activeSlide.elements ?? []).map(element => `extra:${element.id}` as SlideField)
        ] as SlideField[]).map(field => {
          const pos = activeSlide.positions?.[field];
          const visible = field.startsWith("extra:")
            ? (() => { const item = activeSlide.elements?.find(element => `extra:${element.id}` === field); return item && (isBg ? item.textBg : item.textEn || item.textBg); })()
            : field === "eyebrow" ? (isBg ? activeSlide.eyebrowBg : activeSlide.eyebrowEn)
            : field === "title" ? (isBg ? activeSlide.titleBg : activeSlide.titleEn)
            : field === "badge" ? (isBg ? activeSlide.badgeBg : activeSlide.badgeEn)
            : field === "note" ? (isBg ? activeSlide.noteBg : activeSlide.noteEn)
            : (isBg ? activeSlide.ctaBg : activeSlide.ctaEn);
          return pos && visible ? <div key={field} data-hero-field={field}
            className={`absolute z-[15] w-max max-w-[min(35rem,90%)] ${preview ? "cursor-grab touch-none hover:outline hover:outline-2 hover:outline-teal-500" : ""} ${preview?.selected === field ? "outline outline-2 outline-teal-500" : ""}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `scale(${pos.scale ?? 1})`, transformOrigin: "top left" }}>
              {contentByField(activeSlide, field)}
              {preview?.selected === field && (
                <span data-scale-handle="true" title={isBg ? "Плъзни за мащабиране" : "Drag to resize"}
                  className="absolute -bottom-3 -right-3 z-30 flex h-7 w-7 cursor-nwse-resize touch-none items-center justify-center rounded border-2 border-white bg-teal-600 text-lg font-bold leading-none text-white shadow-lg">↘</span>
              )}
            </div> : null;
        })}
        {preview?.selected && (
          <div className="pointer-events-none absolute inset-0 z-[19]" aria-hidden="true">
            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-teal-500/45" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-teal-500/45" />
            {snapGuide.x !== undefined && (
              <div className="absolute inset-y-0 border-l-2 border-teal-500" style={{ left: `${snapGuide.x}%` }} />
            )}
            {snapGuide.y !== undefined && (
              <div className="absolute inset-x-0 border-t-2 border-teal-500" style={{ top: `${snapGuide.y}%` }} />
            )}
          </div>
        )}
        
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
