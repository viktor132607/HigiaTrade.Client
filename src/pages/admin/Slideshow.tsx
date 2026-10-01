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
import type { HomeSlide, HomeSlideshowPayload } from "../../components/home/HomeHeroSlider";

const gradientOptions = [
  { value: "from-teal-100 via-cyan-50 to-white", bg: "Тюркоаз", en: "Teal" },
  { value: "from-sky-100 via-cyan-50 to-white", bg: "Син", en: "Blue" },
  { value: "from-emerald-100 via-teal-50 to-white", bg: "Зелен", en: "Green" },
  { value: "from-orange-100 via-amber-50 to-white", bg: "Оранжев", en: "Orange" },
  { value: "from-violet-100 via-purple-50 to-white", bg: "Лилав", en: "Purple" },
];

type PreviewMode = "desktop" | "mobile";
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
  accent: gradientOptions[0].value,
});

const SlidePreview = ({
  slide,
  mode,
  isBg,
  index,
  total,
}: {
  slide: HomeSlide;
  mode: PreviewMode;
  isBg: boolean;
  index: number;
  total: number;
}) => {
  const desktop = mode === "desktop";
  const eyebrow = isBg ? slide.eyebrowBg : slide.eyebrowEn;
  const title = isBg ? slide.titleBg : slide.titleEn;
  const badge = isBg ? slide.badgeBg : slide.badgeEn;
  const note = isBg ? slide.noteBg : slide.noteEn;
  const cta = isBg ? slide.ctaBg : slide.ctaEn;

  return (
    <div className={`mx-auto overflow-hidden border border-slate-300 bg-white shadow-sm ${desktop ? "w-full" : "w-[320px] max-w-full"}`}>
      <div className={`relative overflow-hidden bg-gradient-to-r ${slide.accent || gradientOptions[0].value} ${desktop ? "aspect-[256/45]" : "aspect-[256/45]"}`}>
        {desktop && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.85),transparent_25%),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.55),transparent_28%)]" />
        )}

        {slide.image && desktop && (
          <img
            src={slide.image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `center ${slide.imagePositionY ?? 50}%` }}
          />
        )}

        {desktop && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/10 to-transparent"
            style={{ opacity: Math.min(100, Math.max(0, slide.imageLightening ?? 100)) / 100 }}
          />
        )}

        <div className={desktop
          ? "relative z-10 mx-auto flex w-full px-14 py-12 sm:px-16 sm:py-16 lg:px-8"
          : "relative z-10 flex px-14 py-12"}
          style={desktop ? { maxWidth: "80rem" } : undefined}
        >
          <div className={desktop
            ? "grid w-full max-w-xl grid-cols-1 grid-rows-[auto_auto_auto_auto_auto]"
            : "grid w-full grid-cols-1 grid-rows-[auto_auto_auto_auto_auto]"
          }>
            <div className="col-start-1 row-start-1">
              {Boolean(eyebrow) && (
                <p className={desktop ? "text-xl font-semibold text-teal-700" : "text-sm font-semibold text-teal-700"}>
                  {eyebrow}
                </p>
              )}
            </div>

            <div className="col-start-1 row-start-2 pt-3">
              <h1 className={`font-display font-extrabold uppercase leading-[1.05] tracking-tight text-slate-950 ${desktop ? "text-6xl" : "text-3xl"}`}>
                {title}
              </h1>
            </div>

            <div className="col-start-1 row-start-3 pt-5">
              {Boolean(badge) && (
                <span className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white">
                  {badge}
                </span>
              )}
            </div>

            <div className={`col-start-1 row-start-4 pt-6 ${desktop ? "pt-8" : ""}`}>
              {Boolean(note) && (
                <p className={`max-w-lg font-semibold text-slate-700 ${desktop ? "text-lg leading-6" : "text-sm leading-6"}`}>
                  {note}
                </p>
              )}
            </div>

            <div className={`col-start-1 row-start-5 pt-6 ${desktop ? "pt-8" : ""}`}>
              {Boolean(cta) && (
                <div className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 py-3 text-sm font-bold uppercase tracking-wide text-white ${desktop ? "px-8" : "px-6"}`}>
                  {cta}
                </div>
              )}
            </div>
          </div>
        </div>

        {desktop && total > 1 && (
          <>
            <div className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow">
              <span className="text-xl leading-none">‹</span>
            </div>
            <div className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow">
              <span className="text-xl leading-none">›</span>
            </div>
            <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {Array.from({ length: total }, (_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={`h-2.5 rounded-full ${dotIndex === index ? "w-10 bg-slate-950" : "w-2.5 bg-slate-500/40"}`}
                />
              ))}
            </div>
          </>
        )}

        {desktop && (
          <div className="absolute inset-x-0 bottom-3 z-30">
            <div className="mx-auto flex w-full justify-center gap-2 px-3 sm:px-6 lg:px-8" style={{ maxWidth: "80rem" }}>
              {[
                isBg ? "Най-продавани" : "Best sellers",
                isBg ? "Последно добавени" : "Recently added",
                isBg ? "Най-висок рейтинг" : "Highest rated",
              ].map((label, tabIndex) => (
                <span
                  key={label}
                  className={`inline-flex min-h-10 items-center rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wide shadow-sm ${tabIndex === 0 ? "bg-orange-500 text-white" : "bg-slate-800 text-white"}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
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
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
            <button type="button" onClick={() => setPreviewMode("desktop")} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${previewMode === "desktop" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}><ComputerDesktopIcon className="h-5 w-5" />{isBg ? "Компютър" : "Desktop"}</button>
            <button type="button" onClick={() => setPreviewMode("mobile")} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${previewMode === "mobile" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}><DevicePhoneMobileIcon className="h-5 w-5" />{isBg ? "Телефон" : "Mobile"}</button>
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
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{isBg ? `Преглед — ${previewMode === "desktop" ? "компютър" : "телефон"}` : `Preview — ${previewMode}`}</div>
              <SlidePreview slide={slide} mode={previewMode} isBg={isBg} index={index} total={slides.length} />
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