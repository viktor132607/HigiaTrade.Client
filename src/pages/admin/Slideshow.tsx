import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import type { HomeSlide, HomeSlideshowPayload, SlideField, SlidePosition, HeroOverlayElement } from "../../components/home/HomeHeroSlider";
import { invalidateHomeSlideshowPreload } from "../../utils/homeSlideshowPreload";
import SlideElementSettingsModal from "../../components/admin/SlideElementSettingsModal";

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

const previewHeights: Partial<Record<PreviewMode, number>> = {
  mobile: 844, laptop: 768, monitor24: 1080, monitor27: 1440,
  iphoneSE: 667, iphone15: 852, iphonePro: 874, iphoneProMax: 956,
  ipadMini: 1133, ipad11: 1180, ipadPro11: 1194, ipad13: 1376,
  macbookAir13: 832, macbookAir15: 900, macbookPro14: 982,
  macbookPro16: 1117, imac24: 1080,
  tabletSmall: 1024, tabletMedium: 1280, tabletLarge: 1365, tabletXL: 1600,
};

const SlidePreview = ({slide, mode, index, total, onMove}: {
  slide: HomeSlide;
  mode: PreviewMode;
  index: number;
  total: number;
  onMove: (field: SlideField, position: SlidePosition) => void;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<SlideField | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const width = previewModes.find(option => option.key === mode)?.width ?? 1366;
  const height = previewHeights[mode] ?? 768;
  const selectedPosition = selected ? slide.positions?.[selected] : undefined;
  const fieldLabels: Partial<Record<SlideField, string>> = {
    eyebrow: isBg ? "Горен текст" : "Eyebrow",
    title: isBg ? "Заглавие" : "Title",
    badge: isBg ? "Етикет" : "Badge",
    note: isBg ? "Описание" : "Description",
    cta: isBg ? "Бутон" : "Button",
  };

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const payloadRef = useRef({ slide, index, total, selected, snapEnabled });
  payloadRef.current = { slide, index, total, selected, snapEnabled };

  const sendUpdate = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({
      type: "hero-preview:update",
      ...payloadRef.current,
    }, window.location.origin);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === "hero-preview:ready") sendUpdate();
      if (data?.type === "hero-preview:select"
        && (typeof data.key === "string" && (["eyebrow", "title", "badge", "note", "cta"].includes(data.key) || data.key.startsWith("extra:")))) {
        setSelected(data.key as SlideField);
      }
      if (data?.type === "hero-preview:move"
        && (typeof data.key === "string" && (["eyebrow", "title", "badge", "note", "cta"].includes(data.key) || data.key.startsWith("extra:")))
        && data.pos && Number.isFinite(data.pos.x) && Number.isFinite(data.pos.y)) {
        onMoveRef.current(data.key as SlideField, data.pos as SlidePosition);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sendUpdate]);

  useEffect(() => { sendUpdate(); }, [slide, index, total, selected, snapEnabled, sendUpdate]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setScale(Math.min(1, host.clientWidth / width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [width]);

  const getFrame = () => {
    try { return iframeRef.current?.contentDocument?.querySelector<HTMLElement>(".home-hero-frame") ?? null; }
    catch { return null; }
  };
  const getField = (frame: HTMLElement, field: SlideField) =>
    [...frame.querySelectorAll<HTMLElement>("[data-hero-field]")]
      .find(node => node.dataset.heroField === field && node.ownerDocument.defaultView?.getComputedStyle(node).visibility !== "hidden");

  const align = (axis: "x" | "y", where: "start" | "middle" | "end") => {
    if (!selected || !selectedPosition) return;
    const frame = getFrame();
    const element = frame && getField(frame, selected);
    if (!frame || !element) return;
    const frameRect = frame.getBoundingClientRect(), itemRect = element.getBoundingClientRect();
    const length = axis === "x" ? itemRect.width / frameRect.width * 100 : itemRect.height / frameRect.height * 100;
    const value = where === "start" ? 5 : where === "middle" ? (100 - length) / 2 : 95 - length;
    onMove(selected, { ...selectedPosition,
      [axis]: Math.round(Math.max(0, Math.min(100 - length, value)) * 100) / 100 });
  };

  const resize = (value: number) => {
    if (!selected || !selectedPosition) return;
    const frame = getFrame();
    const element = frame && getField(frame, selected);
    let maxScale = 2.5;
    if (frame && element) {
      const frameRect = frame.getBoundingClientRect(), rect = element.getBoundingClientRect();
      const original = selectedPosition.scale ?? 1;
      const initialWidth = rect.width / frameRect.width * 100 / original;
      const initialHeight = rect.height / frameRect.height * 100 / original;
      maxScale = Math.min(2.5,
        (100 - selectedPosition.x) / Math.max(initialWidth, 0.01),
        (100 - selectedPosition.y) / Math.max(initialHeight, 0.01));
    }
    onMove(selected, { ...selectedPosition, scale: Math.max(0.5, Math.min(maxScale, value)) });
  };

  const coordinateLabel = selected && selectedPosition
    ? `X ${selectedPosition.x.toFixed(1)}% · Y ${selectedPosition.y.toFixed(1)}% · ${Math.round((selectedPosition.scale ?? 1) * 100)}%`
    : "";

  return <>
        <div className="mb-2 flex flex-wrap items-center justify-between text-xs text-slate-500">
      <span className="font-semibold">{isBg ? "Пълен екран на началната страница" : "Full homepage viewport"}</span>
      <span className="font-mono">{width} × {height} px · {Math.round(scale * 100)}%</span>
    </div>
    <div ref={hostRef} className="w-full overflow-hidden border border-slate-300 bg-white">
      <div className="flex justify-center">
        <div className="relative shrink-0" style={{ width: width * scale, height: height * scale }}>
          <iframe ref={iframeRef}
            title={isBg ? "Преглед на целия екран на сайта" : "Full homepage viewport preview"}
            src="/admin/slideshow-live-preview"
            loading="lazy"
            width={width} height={height}
            onLoad={sendUpdate}
            style={{
              display: "block", width, height, border: 0, maxWidth: "none", maxHeight: "none",
              transform: `scale(${scale})`, transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </div>
    <details className="mb-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><summary className="cursor-pointer font-semibold text-slate-600">{isBg ? "Подравняване и мащабиране" : "Alignment and scale"}</summary><div className="mt-2 flex flex-wrap items-center gap-2">
      <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 font-semibold">
        <input type="checkbox" checked={snapEnabled} onChange={event => setSnapEnabled(event.target.checked)}
          className="h-4 w-4 accent-[#18b99f]" />
        {isBg ? "Прилепване и водачи" : "Snap and guides"}
      </label>
      {selected && selectedPosition ? <>
        <span className="mx-1 font-semibold text-teal-700">{fieldLabels[selected] ?? (isBg ? "Елемент" : "Element")}</span>
        <span className="font-mono text-[11px] text-slate-500">{coordinateLabel}</span>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={isBg ? "Подравняване" : "Alignment"}>
          {([
            ["x", "start", isBg ? "Ляво" : "Left"],
            ["x", "middle", isBg ? "Център X" : "Center X"],
            ["x", "end", isBg ? "Дясно" : "Right"],
            ["y", "start", isBg ? "Горе" : "Top"],
            ["y", "middle", isBg ? "Център Y" : "Center Y"],
            ["y", "end", isBg ? "Долу" : "Bottom"],
          ] as const).map(([axis, where, label]) =>
            <button key={axis + where} type="button" onClick={() => align(axis, where)}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 font-medium hover:border-teal-500 hover:text-teal-700">
              {label}
            </button>)}
        </div>
        <label className="inline-flex min-h-8 items-center gap-2 font-semibold">
          {isBg ? "Размер" : "Scale"}
          <input type="range" min="50" max="250" step="5"
            value={Math.round((selectedPosition.scale ?? 1) * 100)}
            onChange={event => resize(Number(event.target.value) / 100)}
            className="w-28 cursor-pointer accent-[#18b99f]" />
          <span className="w-10 text-right tabular-nums">
            {Math.round((selectedPosition.scale ?? 1) * 100)}%
          </span>
        </label>
      </> : <span className="text-slate-500">
        {isBg ? "Избери текст или бутон от банера за подравняване и мащабиране." : "Select text or a button on the banner to align and resize."}
      </span>}
    </div></details>

  </>;
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
  const [editing, setEditing] = useState<{ slideId: string; field: SlideField } | null>(null);
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

  const updateOverlay = (slideId: string, elementId: string, patch: Partial<HeroOverlayElement>) => {
    setSaved(false);
    setSlides(current => current.map(slide => slide.id === slideId
      ? { ...slide, elements: (slide.elements ?? []).map(element => element.id === elementId ? { ...element, ...patch } : element) }
      : slide));
  };

  const addOverlay = (slideId: string, kind: HeroOverlayElement["kind"]) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    const element: HeroOverlayElement = {
      id, kind, textBg: kind === "button" ? "Нов бутон" : "Нов надпис",
      textEn: kind === "button" ? "New button" : "New text",
      url: "/products",
      color: kind === "button" ? "#ffffff" : "#0f172a",
      background: "#0f172a",
      fontSize: kind === "button" ? 16 : 32,
    };
    setSaved(false);
    setSlides(current => current.map(slide => {
      if (slide.id !== slideId || (slide.elements ?? []).length >= 30) return slide;
      const count = (slide.elements ?? []).length;
      return {
        ...slide, elements: [...(slide.elements ?? []), element],
        positions: { ...slide.positions, [`extra:${id}`]: { x: 25, y: Math.min(75, 24 + count * 9), scale: 1 } },
      };
    }));
    setEditing({ slideId, field: `extra:${id}` });
  };

  const deleteOverlay = (slideId: string, field: SlideField) => {
    setSaved(false);
    setSlides(current => current.map(slide => {
      if (slide.id !== slideId) return slide;
      const positions = { ...slide.positions };
      delete positions[field];
      if (field.startsWith("extra:")) {
        return { ...slide, positions, elements: (slide.elements ?? []).filter(item => item.id !== field.slice(6)) };
      }
      const keys: Record<string, [keyof HomeSlide, keyof HomeSlide]> = {
        eyebrow: ["eyebrowBg", "eyebrowEn"], title: ["titleBg", "titleEn"],
        badge: ["badgeBg", "badgeEn"], note: ["noteBg", "noteEn"], cta: ["ctaBg", "ctaEn"],
      };
      const pair = keys[field];
      return pair ? { ...slide, positions, [pair[0]]: "", [pair[1]]: "" } : slide;
    }));
    setEditing(null);
  };

  const changeOverlayText = (slideId: string, elementId: string, value: string) => {
    updateOverlay(slideId, elementId, { textBg: value });
    const fieldId = `${slideId}:extra:${elementId}`;
    if (translationTimers.current[fieldId]) clearTimeout(translationTimers.current[fieldId]);
    translationRequestIds.current[fieldId] = (translationRequestIds.current[fieldId] ?? 0) + 1;
    const requestId = translationRequestIds.current[fieldId];
    if (!value.trim()) {
      updateOverlay(slideId, elementId, { textEn: "" });
      return;
    }
    translationTimers.current[fieldId] = setTimeout(async () => {
      try {
        setTranslatingFields(current => ({ ...current, [fieldId]: true }));
        const response = await fetch(`${API_BASE_URL}/translation/bg-to-en`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ text: value }),
        });
        const data = await readApiJson<{ translation: string }>(response);
        if (translationRequestIds.current[fieldId] !== requestId) return;
        setSlides(current => current.map(slide => slide.id !== slideId ? slide : ({
          ...slide, elements: (slide.elements ?? []).map(item =>
            item.id === elementId && item.textBg === value ? { ...item, textEn: data.translation } : item),
        })));
        setSaved(false);
      } catch (err) {
        if (translationRequestIds.current[fieldId] === requestId) {
          setError(err instanceof Error ? err.message : isBg ? "Преводът не успя." : "Translation failed.");
        }
      } finally {
        if (translationRequestIds.current[fieldId] === requestId) {
          setTranslatingFields(current => ({ ...current, [fieldId]: false }));
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

            <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
              <div className="grid gap-2 lg:grid-cols-[190px_230px_minmax(0,1fr)] lg:items-center">
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#18b99f] px-3 text-sm font-bold text-white transition hover:bg-[#149f8a]">
                  <PlusIcon className="h-4 w-4" />
                  {uploadingId === slide.id ? (isBg ? "Качване..." : "Uploading...") : (isBg ? "Качи снимка" : "Upload image")}
                  <input type="file" accept="image/*" className="sr-only" disabled={uploadingId === slide.id}
                    onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(slide.id, file); event.currentTarget.value = ""; }} />
                </label>
                <label className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="shrink-0">{isBg ? "Позиция" : "Image Y"}</span>
                  <input type="range" min="0" max="100" step="1" value={slide.imagePositionY ?? 50}
                    onChange={event => updateSlide(slide.id, "imagePositionY", Number(event.target.value))}
                    className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#18b99f]" />
                  <span className="w-9 shrink-0 text-right tabular-nums">{Math.round(slide.imagePositionY ?? 50)}%</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button type="button" onClick={() => addOverlay(slide.id, "text")} disabled={(slide.elements ?? []).length >= 30}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-[#18b99f] hover:text-[#149f8a]">
                    <PlusIcon className="h-4 w-4" />{isBg ? "Добави надпис" : "Add text"}
                  </button>
                  <button type="button" onClick={() => addOverlay(slide.id, "button")} disabled={(slide.elements ?? []).length >= 30}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-[#18b99f] hover:text-[#149f8a]">
                    <PlusIcon className="h-4 w-4" />{isBg ? "Добави бутон" : "Add button"}
                  </button>
                  <button type="button" onClick={() => updateSlide(slide.id, "positions", {})}
                    className="min-h-9 rounded-md px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                    {isBg ? "Нулирай позиции" : "Reset positions"}
                  </button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2 lg:grid-cols-[190px_230px_minmax(0,1fr)] lg:items-center">
                <label className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="shrink-0">{isBg ? "Фон" : "Background"}</span>
                  <select value={slide.accent} onChange={event => updateSlide(slide.id, "accent", event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800">
                    {gradientOptions.map(option => <option key={option.value} value={option.value}>{isBg ? option.bg : option.en}</option>)}
                  </select>
                </label>
                <label className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="shrink-0">{isBg ? "Изсветляване" : "Lightening"}</span>
                  <input type="range" min="0" max="100" step="1" value={slide.imageLightening ?? 100}
                    onChange={event => updateSlide(slide.id, "imageLightening", Number(event.target.value))}
                    className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#18b99f]" />
                  <span className="w-9 shrink-0 text-right tabular-nums">{Math.round(slide.imageLightening ?? 100)}%</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 lg:justify-end" aria-label={isBg ? "Редактирай елементи" : "Edit elements"}>
                  {([
                    { field: "eyebrow" as const, text: slide.eyebrowBg, bg: "Горен текст", en: "Eyebrow" },
                    { field: "title" as const, text: slide.titleBg, bg: "Заглавие", en: "Title" },
                    { field: "badge" as const, text: slide.badgeBg, bg: "Етикет", en: "Badge" },
                    { field: "note" as const, text: slide.noteBg, bg: "Описание", en: "Description" },
                    { field: "cta" as const, text: slide.ctaBg, bg: "Бутон", en: "Button" },
                  ]).filter(item => item.text.trim()).map(item => (
                    <button key={item.field} type="button" onClick={() => setEditing({ slideId: slide.id, field: item.field })}
                      className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#18b99f]">
                      <PencilSquareIcon className="h-3.5 w-3.5" />{isBg ? item.bg : item.en}
                    </button>
                  ))}
                  {(slide.elements ?? []).map(element => (
                    <button key={element.id} type="button" onClick={() => setEditing({ slideId: slide.id, field: `extra:${element.id}` })}
                      className="inline-flex min-h-8 items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100"
                      title={isBg ? element.textBg : element.textEn}>
                      <PencilSquareIcon className="h-3.5 w-3.5" />{(isBg ? element.textBg : element.textEn).slice(0, 26)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-100/70 p-3 sm:p-4">
              <SlidePreview slide={slide} mode={previewMode} index={index} total={slides.length}
                onMove={(field, position) => {
                  setSaved(false);
                  setSlides(current => current.map(item => item.id === slide.id
                    ? { ...item, positions: { ...item.positions, [field]: position } } : item));
                }} />
            </div>
          </section>
        ))}
      </div>
      {editing && (() => {
        const selectedSlide = slides.find(item => item.id === editing.slideId);
        if (!selectedSlide) return null;
        return <SlideElementSettingsModal
          slide={selectedSlide} field={editing.field} isBg={isBg}
          translating={Boolean(translatingFields[`${editing.slideId}:${editing.field.startsWith("extra:") ? editing.field : editing.field + "Bg"}`])}
          onClose={() => setEditing(null)}
          onDelete={() => deleteOverlay(editing.slideId, editing.field)}
          onLegacyChange={(key, value, translate) => {
            if (translate) updateBgAndTranslate(editing.slideId, key as BgTranslationKey, value);
            else {
              setSaved(false);
              setSlides(current => current.map(item => item.id === editing.slideId ? { ...item, [key]: value } : item));
            }
          }}
          onExtraChange={(patch, translateBg) => {
            const id = editing.field.slice(6);
            if (translateBg && typeof patch.textBg === "string") changeOverlayText(editing.slideId, id, patch.textBg);
            else updateOverlay(editing.slideId, id, patch);
          }}
          onPositionChange={position => {
            setSaved(false);
            setSlides(current => current.map(item => item.id === editing.slideId
              ? { ...item, positions: { ...item.positions, [editing.field]: position } } : item));
          }}
        />;
      })()}
    </div>
  );
};

export default AdminSlideshow;