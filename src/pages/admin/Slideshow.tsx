import { useEffect, useState } from "react";
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
  accent: gradientOptions[0].value,
});

const SlidePreview = ({ slide, mode, isBg }: { slide: HomeSlide; mode: PreviewMode; isBg: boolean }) => {
  const desktop = mode === "desktop";
  return (
    <div className={`mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm ${desktop ? "w-full" : "w-[320px] max-w-full"}`}>
      <div className={`relative overflow-hidden bg-gradient-to-r ${slide.accent || gradientOptions[0].value} ${desktop ? "aspect-[16/5] min-h-56" : "aspect-[9/14] min-h-[470px]"}`}>
        {slide.image && (
          <img
            src={slide.image}
            alt={isBg ? slide.titleBg : slide.titleEn}
            className={`absolute object-cover ${desktop ? "inset-y-0 left-[30%] h-full w-[70%]" : "inset-x-0 bottom-0 h-[55%] w-full"}`}
          />
        )}
        <div className={`absolute inset-0 ${desktop ? "bg-gradient-to-r from-white/95 via-white/80 to-transparent" : "bg-gradient-to-b from-white/95 via-white/85 to-transparent"}`} />
        <div className={`relative z-10 ${desktop ? "max-w-[44%] p-7" : "p-5"}`}>
          <div className="text-sm font-semibold text-teal-700">{isBg ? slide.eyebrowBg : slide.eyebrowEn}</div>
          <div className={`${desktop ? "mt-2 text-4xl" : "mt-2 text-3xl"} font-extrabold uppercase leading-tight text-slate-950`}>{isBg ? slide.titleBg : slide.titleEn}</div>
          {(isBg ? slide.badgeBg : slide.badgeEn) && <div className="mt-4 inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black text-white">{isBg ? slide.badgeBg : slide.badgeEn}</div>}
          <div className={`${desktop ? "mt-5 text-sm" : "mt-4 text-sm"} font-medium leading-6 text-slate-700`}>{isBg ? slide.noteBg : slide.noteEn}</div>
          {(isBg ? slide.ctaBg : slide.ctaEn) && <div className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold uppercase text-white">{isBg ? slide.ctaBg : slide.ctaEn}</div>}
        </div>
      </div>
    </div>
  );
};

const AdminSlideshow = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/home-slideshow`, { cache: "no-store" });
      const payload = await readApiJson<HomeSlideshowPayload>(response);
      setSlides(Array.isArray(payload?.slides) ? [...payload.slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Слайдшоуто не можа да бъде заредено." : "The slideshow could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateSlide = <K extends keyof HomeSlide>(id: string, key: K, value: HomeSlide[K]) => {
    setSaved(false);
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, [key]: value } : slide)));
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
      const payload: HomeSlideshowPayload = { slides: slides.map((slide, order) => ({ ...slide, order })) };
      const response = await fetch(`${API_BASE_URL}/home-slideshow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const savedPayload = await readApiJson<HomeSlideshowPayload>(response);
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
          <p className="mt-1 text-sm text-slate-500">{isBg ? "Променяй снимките, текста, бутоните, реда и видимостта на слайдовете." : "Edit slide images, text, buttons, order and visibility."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              <SlidePreview slide={slide} mode={previewMode} isBg={isBg} />
            </div>

            <div className="grid gap-5 p-4 xl:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{isBg ? "Снимка" : "Image"}</label>
                  <input type="text" value={slide.image} onChange={(event) => updateSlide(slide.id, "image", event.target.value)} placeholder="https://..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
                  <TextInput label="Горен текст (BG)" value={slide.eyebrowBg} onChange={(value) => updateSlide(slide.id, "eyebrowBg", value)} />
                  <TextInput label="Eyebrow (EN)" value={slide.eyebrowEn} onChange={(value) => updateSlide(slide.id, "eyebrowEn", value)} />
                  <TextInput label="Заглавие (BG)" value={slide.titleBg} onChange={(value) => updateSlide(slide.id, "titleBg", value)} />
                  <TextInput label="Title (EN)" value={slide.titleEn} onChange={(value) => updateSlide(slide.id, "titleEn", value)} />
                  <TextInput label="Етикет (BG)" value={slide.badgeBg} onChange={(value) => updateSlide(slide.id, "badgeBg", value)} />
                  <TextInput label="Badge (EN)" value={slide.badgeEn} onChange={(value) => updateSlide(slide.id, "badgeEn", value)} />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <TextArea label="Описание (BG)" value={slide.noteBg} onChange={(value) => updateSlide(slide.id, "noteBg", value)} />
                  <TextArea label="Description (EN)" value={slide.noteEn} onChange={(value) => updateSlide(slide.id, "noteEn", value)} />
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <TextInput label="Бутон (BG)" value={slide.ctaBg} onChange={(value) => updateSlide(slide.id, "ctaBg", value)} />
                  <TextInput label="Button (EN)" value={slide.ctaEn} onChange={(value) => updateSlide(slide.id, "ctaEn", value)} />
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
