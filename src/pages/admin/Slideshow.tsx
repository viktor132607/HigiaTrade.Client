import { useEffect, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import HomeHeroSlider, {type HomeSlide, type HomeSlideshowPayload, type SlideField, type SlidePosition} from "../../components/home/HomeHeroSlider";
import { invalidateHomeSlideshowPreload } from "../../utils/homeSlideshowPreload";

const gradientOptions = [
  { value: "from-teal-100 via-cyan-50 to-white", bg: "Тюркоаз", en: "Teal" },
  { value: "from-sky-100 via-cyan-50 to-white", bg: "Син", en: "Blue" },
  { value: "from-emerald-100 via-teal-50 to-white", bg: "Зелен", en: "Green" },
  { value: "from-orange-100 via-amber-50 to-white", bg: "Оранжев", en: "Orange" },
  { value: "from-violet-100 via-purple-50 to-white", bg: "Лилав", en: "Purple" },
];

// Widths are CSS viewport pixels (not physical panel resolution).
const previewModes = [
  { key: "mobile", category: "standard", width: 390, labelBg: "Телефон", labelEn: "Phone" },
  { key: "laptop", category: "standard", width: 1366, labelBg: "Лаптоп", labelEn: "Laptop" },
  { key: "monitor24", category: "standard", width: 1920, labelBg: 'Монитор 24″', labelEn: 'Monitor 24″' },
  { key: "monitor27", category: "standard", width: 2560, labelBg: 'Монитор 27″', labelEn: 'Monitor 27″' },
  { key: "iphoneSE", category: "apple", width: 375, labelBg: "iPhone SE", labelEn: "iPhone SE" },
  { key: "iphone15", category: "apple", width: 393, labelBg: "iPhone 15 / 16", labelEn: "iPhone 15 / 16" },
  { key: "iphonePro", category: "apple", width: 402, labelBg: "iPhone 16 / 17 Pro", labelEn: "iPhone 16 / 17 Pro" },
  { key: "iphoneProMax", category: "apple", width: 440, labelBg: "iPhone 16 / 17 Pro Max", labelEn: "iPhone 16 / 17 Pro Max" },
  { key: "ipadMini", category: "apple", width: 744, labelBg: "iPad mini", labelEn: "iPad mini" },
  { key: "ipad11", category: "apple", width: 820, labelBg: "iPad 11″ / Air 11″", labelEn: "iPad 11″ / Air 11″" },
  { key: "ipadPro11", category: "apple", width: 834, labelBg: "iPad Pro 11″", labelEn: "iPad Pro 11″" },
  { key: "ipad13", category: "apple", width: 1032, labelBg: "iPad Air / Pro 13″", labelEn: "iPad Air / Pro 13″" },
  { key: "macbookAir13", category: "apple", width: 1280, labelBg: "MacBook Air 13″", labelEn: "MacBook Air 13″" },
  { key: "macbookAir15", category: "apple", width: 1440, labelBg: "MacBook Air 15″", labelEn: "MacBook Air 15″" },
  { key: "macbookPro14", category: "apple", width: 1512, labelBg: "MacBook Pro 14″", labelEn: "MacBook Pro 14″" },
  { key: "macbookPro16", category: "apple", width: 1728, labelBg: "MacBook Pro 16″", labelEn: "MacBook Pro 16″" },
  { key: "imac24", category: "apple", width: 1920, labelBg: "iMac 24″", labelEn: "iMac 24″" },
  { key: "tabletSmall", category: "tablet", width: 768, labelBg: "Таблет 8″", labelEn: "8″ tablet" },
  { key: "tabletMedium", category: "tablet", width: 800, labelBg: "Таблет 10″", labelEn: "10″ tablet" },
  { key: "tabletLarge", category: "tablet", width: 1024, labelBg: "Таблет 11″", labelEn: "11″ tablet" },
  { key: "tabletXL", category: "tablet", width: 1200, labelBg: "Таблет 12–14″", labelEn: "12–14″ tablet" },
] as const;
type PreviewMode = (typeof previewModes)[number]["key"];
type PreviewCategory = (typeof previewModes)[number]["category"];
type BgTranslationKey = "eyebrowBg" | "titleBg" | "badgeBg" | "noteBg" | "ctaBg";
type EnTranslationKey = "eyebrowEn" | "titleEn" | "badgeEn" | "noteEn" | "ctaEn";

const translationTargets: Record<BgTranslationKey, EnTranslationKey> = {
  eyebrowBg: "eyebrowEn",
  titleBg: "titleEn",
  badgeBg: "badgeEn",
  noteBg: "noteEn",
  ctaBg: "ctaEn",
};

const newSlide = (order: number): HomeSlide => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${order}`,
  order,
  isActive: true,
  eyebrowBg: "",
  eyebrowEn: "",
  titleBg: "Нов слайд",
  titleEn: "New slide",
  badgeBg: "",
  badgeEn: "",
  noteBg: "",
  noteEn: "",
  ctaBg: "Към продуктите",
  ctaEn: "View products",
  ctaUrl: "/products",
  image: "",
  imagePositionY: 50,
  imageLightening: 100,
  positions: {},
  accent: gradientOptions[0].value,
});

const SlidePreview = ({slide, mode, index, total, onMove}: {
  slide: HomeSlide; mode: PreviewMode; index: number; total: number;
  onMove: (field: SlideField, position: SlidePosition) => void;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);
  const width = previewModes.find((option) => option.key === mode)?.width ?? 1366;
  const responsiveClass = width < 768 ? "home-hero-mobile-preview"
    : width < 1024 ? "home-hero-tablet-preview"
    : width < 1920 ? "home-hero-laptop-preview"
    : width < 2200 ? "home-hero-monitor24-preview" : "home-hero-monitor27-preview";

  useEffect(() => {
    const host = hostRef.current, scene = sceneRef.current;
    if (!host || !scene) return;
    const measure = () => {
      const factor = Math.min(1, host.clientWidth / width);
      setScale(factor);
      setHeight(scene.scrollHeight * factor);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host); observer.observe(scene);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [width, mode]);

  return <div ref={hostRef} className="w-full overflow-hidden border border-slate-300 bg-white">
    <div style={{ height }}>
      <div ref={sceneRef} className={responsiveClass}
        style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <HomeHeroSlider preview={{slide, index, total, onMove}} />
      </div>
    </div>
  </div>;
};

const AdminSlideshow = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [slideDurationSeconds, setSlideDurationSeconds] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("laptop");
  const [translatingFields, setTranslatingFields] = useState<Record<string, boolean>>({});
  const translationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const translationRequestIds = useRef<Record<string, number>>({});

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/home-slideshow`, { cache: "no-store" });
      const payload = await readApiJson<HomeSlideshowPayload>(response);
      setSlideDurationSeconds(
        Number.isFinite(payload?.slideDurationSeconds) && (payload.slideDurationSeconds ?? 0) > 0
          ? Math.min(60, Math.max(1, payload.slideDurationSeconds as number))
          : 5
      );
      setSlides(Array.isArray(payload?.slides) ? [...payload.slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Слайдшоуто не можа да бъде заредено." : "The slideshow could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => () => {
    Object.values(translationTimers.current).forEach((timer) => clearTimeout(timer));
  }, []);

  const updateSlide = <K extends keyof HomeSlide>(id: string, key: K, value: HomeSlide[K]) => {
    setSaved(false);
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, [key]: value } : slide)));
  };

  const updateBgAndTranslate = (slideId: string, key: BgTranslationKey, value: string) => {
    const enKey = translationTargets[key];
    const fieldId = `${slideId}:${key}`;

    updateSlide(slideId, key, value);

    if (translationTimers.current[fieldId]) {
      clearTimeout(translationTimers.current[fieldId]);
    }

    translationRequestIds.current[fieldId] = (translationRequestIds.current[fieldId] ?? 0) + 1;
    const requestId = translationRequestIds.current[fieldId];

    if (!value.trim()) {
      updateSlide(slideId, enKey, "");
      setTranslatingFields((current) => ({ ...current, [fieldId]: false }));
      return;
    }

    translationTimers.current[fieldId] = setTimeout(async () => {
      try {
        setTranslatingFields((current) => ({ ...current, [fieldId]: true }));
        const response = await fetch(`${API_BASE_URL}/translation/bg-to-en`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: value }),
        });
        const data = await readApiJson<{ translation: string }>(response);

        if (translationRequestIds.current[fieldId] !== requestId) return;

        setSlides((current) => current.map((slide) => (
          slide.id === slideId && slide[key] === value
            ? { ...slide, [enKey]: data.translation }
            : slide
        )));
        setSaved(false);
      } catch (err) {
        if (translationRequestIds.current[fieldId] === requestId) {
          setError(err instanceof Error ? err.message : isBg ? "Автоматичният превод не успя." : "Automatic translation failed.");
        }
      } finally {
        if (translationRequestIds.current[fieldId] === requestId) {
          setTranslatingFields((current) => ({ ...current, [fieldId]: false }));
        }
      }
    }, 700);
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSaved(false);
    setSlides((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((slide, order) => ({ ...slide, order }));
    });
  };

  const deleteSlide = (id: string) => {
    if (slides.length <= 1) {
      setError(isBg ? "Трябва да остане поне един слайд." : "At least one slide must remain.");
      return;
    }
    setSaved(false);
    setSlides((current) => current.filter((slide) => slide.id !== id).map((slide, order) => ({ ...slide, order })));
  };

  const addSlide = () => {
    setSaved(false);
    setSlides((current) => [...current, newSlide(current.length)]);
  };

  const uploadImage = async (slideId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(isBg ? "Избери валидно изображение." : "Choose a valid image.");
      return;
    }
    try {
      setUploadingId(slideId);
      setError("");
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API_BASE_URL}/Images/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      const data = await readApiJson<{ url: string }>(response);
      updateSlide(slideId, "image", data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Снимката не можа да бъде качена." : "The image could not be uploaded.");
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");
      const payload: HomeSlideshowPayload = {
        slideDurationSeconds,
        slides: slides.map((slide, order) => ({ ...slide, order })),
      };
      const response = await fetch(`${API_BASE_URL}/home-slideshow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const savedPayload = await readApiJson<HomeSlideshowPayload>(response);
      setSlideDurationSeconds(savedPayload.slideDurationSeconds ?? slideDurationSeconds);
      setSlides(savedPayload.slides ?? payload.slides);
      invalidateHomeSlideshowPreload();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Промените не можаха да бъдат запазени." : "The changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-80 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#18b99f]" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{isBg ? "Слайдшоу на началната страница" : "Home page slideshow"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isBg ? "Променяй снимките, текста, бутоните, реда и видимостта на слайдовете. BG полетата се превеждат автоматично на EN." : "Edit slide images, text, buttons, order and visibility. BG fields are translated automatically to EN."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
            <span>{isBg ? "Време на слайд" : "Slide duration"}</span>
            <input
              type="number"
              min="1"
              max="60"
              step="1"
              value={slideDurationSeconds}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                setSaved(false);
                setSlideDurationSeconds(Math.min(60, Math.max(1, Math.round(value))));
              }}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center text-sm text-slate-900"
              aria-label={isBg ? "Време на слайд в секунди" : "Slide duration in seconds"}
            />
            <span className="text-xs text-slate-500">{isBg ? "сек." : "sec"}</span>
          </label>
          <div role="group" aria-label={isBg ? "Размер на прегледа" : "Preview viewport size"} className="flex max-w-full flex-wrap gap-1 rounded-lg border border-slate-300 bg-white p-1">
            {previewModes.filter((option) => option.category === "standard").map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={previewMode === option.key}
                onClick={() => setPreviewMode(option.key)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${previewMode === option.key ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {option.key === "mobile"
                  ? <DevicePhoneMobileIcon className="h-5 w-5 shrink-0" />
                  : <ComputerDesktopIcon className="h-5 w-5 shrink-0" />}
                <span>{isBg ? option.labelBg : option.labelEn}</span>
              </button>
            ))}
            {(["apple", "tablet"] as PreviewCategory[]).map((category) => {
              const choices = previewModes.filter((option) => option.category === category);
              const selected = choices.some((option) => option.key === previewMode);
              return (
                <select
                  key={category}
                  aria-label={category === "apple" ? (isBg ? "Apple устройства" : "Apple devices") : (isBg ? "Таблети" : "Tablets")}
                  value={selected ? previewMode : ""}
                  onChange={(event) => {
                    if (event.target.value) setPreviewMode(event.target.value as PreviewMode);
                  }}
                  className={`min-h-10 max-w-full cursor-pointer rounded-md border-0 px-3 py-2 text-sm font-semibold ${selected ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  <option value="" disabled>{category === "apple" ? "Apple" : (isBg ? "Таблети" : "Tablets")}</option>
                  {choices.map((option) => (
                    <option key={option.key} value={option.key}>
                      {isBg ? option.labelBg : option.labelEn} — {option.width} px
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
          <button type="button" onClick={addSlide} className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><PlusIcon className="mr-2 h-5 w-5" />{isBg ? "Добави слайд" : "Add slide"}</button>
          <button type="button" onClick={() => void save()} disabled={saving || slides.length === 0} className="min-h-11 rounded-md bg-[#18b99f] px-5 py-2 text-sm font-bold text-white hover:bg-[#149f8a] disabled:opacity-50">{saving ? (isBg ? "Запазване..." : "Saving...") : (isBg ? "Запази промените" : "Save changes")}</button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{isBg ? "Промените са запазени и вече се използват на началната страница." : "Changes are saved and are now used on the home page."}</div>}

      <div className="space-y-5">
        {slides.map((slide, index) => (
          <section key={slide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={slide.isActive} onChange={(event) => updateSlide(slide.id, "isActive", event.target.checked)} className="h-5 w-5 rounded border-slate-300 accent-[#18b99f]" />{isBg ? "Активен" : "Active"}</label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveSlide(index, -1)} disabled={index === 0} className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 disabled:opacity-30"><ArrowUpIcon className="h-5 w-5" /></button>
                <button type="button" onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1} className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 disabled:opacity-30"><ArrowDownIcon className="h-5 w-5" /></button>
                <button type="button" onClick={() => deleteSlide(slide.id)} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-100/70 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>{isBg ? "Преглед — същият банер като Home" : "Preview — same banner as Home"}</span>
                <span>{isBg ? "Плъзни текста или бутона" : "Drag text or button"}</span>
                <button type="button" onClick={() => updateSlide(slide.id,"positions",{})} className="rounded border bg-white px-2 py-1 normal-case">{isBg ? "Нулирай позициите" : "Reset positions"}</button>
              </div>
              <SlidePreview slide={slide} mode={previewMode} index={index} total={slides.length}
                onMove={(field, position) => {
                  setSaved(false);
                  setSlides(current => current.map(item => item.id === slide.id
                    ? {...item, positions: {...item.positions, [field]: position}} : item));
                }} />
            </div>

            <div className="grid gap-5 p-4 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isBg ? "Снимка" : "Image"}</label>
                  <p className="mb-2 text-xs font-semibold text-slate-500">{isBg ? "Препоръчителен размер: 2560 × 450 px. Други размери се разтягат по цялата ширина и се изрязват по височина." : "Recommended size: 2560 × 450 px. Other sizes fill the full width and are cropped vertically."}</p>
                  <input type="text" value={slide.image} onChange={(event) => updateSlide(slide.id, "image", event.target.value)} placeholder="https://..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{isBg ? "Вертикална позиция на снимката" : "Image vertical position"}</label>
                    <span className="text-xs font-semibold text-slate-600">{Math.round(slide.imagePositionY ?? 50)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={slide.imagePositionY ?? 50}
                    onChange={(event) => updateSlide(slide.id, "imagePositionY", Number(event.target.value))}
                    className="w-full cursor-pointer accent-[#18b99f]"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>{isBg ? "Нагоре" : "Top"}</span>
                    <span>{isBg ? "Надолу" : "Bottom"}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{isBg ? "Изсветляване на изображението" : "Image lightening"}</label>
                    <span className="text-xs font-semibold text-slate-600">{Math.round(slide.imageLightening ?? 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={slide.imageLightening ?? 100}
                    onChange={(event) => updateSlide(slide.id, "imageLightening", Number(event.target.value))}
                    className="w-full cursor-pointer accent-[#18b99f]"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>{isBg ? "Без изсветляване" : "Original"}</span>
                    <span>{isBg ? "Максимално" : "Maximum"}</span>
                  </div>
                </div>
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {uploadingId === slide.id ? (isBg ? "Качване..." : "Uploading...") : (isBg ? "Качи нова снимка" : "Upload new image")}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingId === slide.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(slide.id, file); event.currentTarget.value = ""; }} />
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isBg ? "Цветен фон" : "Background accent"}</label>
                  <select value={slide.accent} onChange={(event) => updateSlide(slide.id, "accent", event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">{gradientOptions.map((option) => <option key={option.value} value={option.value}>{isBg ? option.bg : option.en}</option>)}</select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  <TextInput label="Горен текст (BG)" value={slide.eyebrowBg} onChange={(value) => updateBgAndTranslate(slide.id, "eyebrowBg", value)} />
                  <TextInput label={`Eyebrow (EN)${translatingFields[`${slide.id}:eyebrowBg`] ? " — translating..." : ""}`} value={slide.eyebrowEn} onChange={(value) => updateSlide(slide.id, "eyebrowEn", value)} />
                  <TextInput label="Заглавие (BG)" value={slide.titleBg} onChange={(value) => updateBgAndTranslate(slide.id, "titleBg", value)} />
                  <TextInput label={`Title (EN)${translatingFields[`${slide.id}:titleBg`] ? " — translating..." : ""}`} value={slide.titleEn} onChange={(value) => updateSlide(slide.id, "titleEn", value)} />
                  <TextInput label="Етикет (BG)" value={slide.badgeBg} onChange={(value) => updateBgAndTranslate(slide.id, "badgeBg", value)} />
                  <TextInput label={`Badge (EN)${translatingFields[`${slide.id}:badgeBg`] ? " — translating..." : ""}`} value={slide.badgeEn} onChange={(value) => updateSlide(slide.id, "badgeEn", value)} />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <TextArea label="Описание (BG)" value={slide.noteBg} onChange={(value) => updateBgAndTranslate(slide.id, "noteBg", value)} />
                  <TextArea label={`Description (EN)${translatingFields[`${slide.id}:noteBg`] ? " — translating..." : ""}`} value={slide.noteEn} onChange={(value) => updateSlide(slide.id, "noteEn", value)} />
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <TextInput label="Бутон (BG)" value={slide.ctaBg} onChange={(value) => updateBgAndTranslate(slide.id, "ctaBg", value)} />
                  <TextInput label={`Button (EN)${translatingFields[`${slide.id}:ctaBg`] ? " — translating..." : ""}`} value={slide.ctaEn} onChange={(value) => updateSlide(slide.id, "ctaEn", value)} />
                  <TextInput label={isBg ? "Линк на бутона" : "Button URL"} value={slide.ctaUrl} onChange={(value) => updateSlide(slide.id, "ctaUrl", value)} />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#18b99f] focus:outline-none focus:ring-2 focus:ring-[#18b99f]/15" /></label>
);

const TextArea = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#18b99f] focus:outline-none focus:ring-2 focus:ring-[#18b99f]/15" /></label>
);

export default AdminSlideshow;