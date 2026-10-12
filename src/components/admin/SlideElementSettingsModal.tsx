import { useEffect } from "react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { HeroOverlayElement, HomeSlide, LegacySlideField, SlideField, SlidePosition } from "../home/HomeHeroSlider";

type FieldName = "eyebrow" | "title" | "badge" | "note" | "cta";
const keys: Record<FieldName, { bg: keyof HomeSlide; en: keyof HomeSlide; bgLabel: string; enLabel: string }> = {
  eyebrow: { bg: "eyebrowBg", en: "eyebrowEn", bgLabel: "Горен текст (BG)", enLabel: "Eyebrow (EN)" },
  title: { bg: "titleBg", en: "titleEn", bgLabel: "Заглавие (BG)", enLabel: "Title (EN)" },
  badge: { bg: "badgeBg", en: "badgeEn", bgLabel: "Етикет (BG)", enLabel: "Badge (EN)" },
  note: { bg: "noteBg", en: "noteEn", bgLabel: "Описание (BG)", enLabel: "Description (EN)" },
  cta: { bg: "ctaBg", en: "ctaEn", bgLabel: "Бутон (BG)", enLabel: "Button (EN)" },
};
const input = "w-full min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#18b99f] focus:outline-none focus:ring-2 focus:ring-[#18b99f]/20";

type Props = {
  slide: HomeSlide;
  field: SlideField;
  isBg: boolean;
  translating?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onLegacyChange: (key: keyof HomeSlide, value: string, translate: boolean) => void;
  onExtraChange: (patch: Partial<HeroOverlayElement>, translateBg?: boolean) => void;
  onPositionChange: (position: SlidePosition) => void;
};

export default function SlideElementSettingsModal({
  slide, field, isBg, translating, onClose, onDelete, onLegacyChange, onExtraChange, onPositionChange,
}: Props) {
  const isExtra = field.startsWith("extra:");
  const extra = isExtra ? slide.elements?.find(element => element.id === field.slice(6)) : null;
  const legacy = !isExtra ? keys[field as LegacySlideField] : null;
  const isButton = extra ? extra.kind === "button" : field === "cta";
  const title = isButton ? (isBg ? "Настройки на бутон" : "Button settings")
    : (isBg ? "Настройки на надпис" : "Text settings");
  const bg = extra ? extra.textBg : String(legacy ? slide[legacy.bg] ?? "" : "");
  const en = extra ? extra.textEn : String(legacy ? slide[legacy.en] ?? "" : "");
  const url = extra ? extra.url : slide.ctaUrl;
  const pos = slide.positions?.[field];
  const isBgTitle = legacy?.bgLabel ?? (isBg ? "Текст (BG)" : "Text (BG)");
  const enTitle = legacy?.enLabel ?? "Text (EN)";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updatePosition = (patch: Partial<SlidePosition>) => {
    onPositionChange({ x: 25, y: 24, scale: 1, ...pos, ...patch });
  };

  if (isExtra && !extra) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} aria-label={isBg ? "Затвори" : "Close"}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              <span className="mb-1 block">{isBgTitle}</span>
              {field === "note" || (extra?.kind === "text")
                ? <textarea rows={3} className={input} value={bg}
                    onChange={e => extra ? onExtraChange({ textBg: e.target.value }, true) : legacy && onLegacyChange(legacy.bg, e.target.value, true)} />
                : <input className={input} value={bg}
                    onChange={e => extra ? onExtraChange({ textBg: e.target.value }, true) : legacy && onLegacyChange(legacy.bg, e.target.value, true)} />}
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              <span className="mb-1 block">{enTitle} {translating ? "…" : ""}</span>
              {field === "note" || extra?.kind === "text"
                ? <textarea rows={3} className={input} value={en}
                    onChange={e => extra ? onExtraChange({ textEn: e.target.value }) : legacy && onLegacyChange(legacy.en, e.target.value, false)} />
                : <input className={input} value={en}
                    onChange={e => extra ? onExtraChange({ textEn: e.target.value }) : legacy && onLegacyChange(legacy.en, e.target.value, false)} />}
            </label>
          </div>
          {isButton && (
            <label className="block text-xs font-semibold text-slate-600">
              <span className="mb-1 block">{isBg ? "Адрес на бутона" : "Button link"}</span>
              <input className={input} value={url} placeholder="/products"
                onChange={e => extra ? onExtraChange({ url: e.target.value }) : onLegacyChange("ctaUrl", e.target.value, false)} />
            </label>
          )}
          {extra && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                <span className="mb-2 block">{isBg ? "Цвят на текста" : "Text color"}</span>
                <input type="color" value={extra.color} onChange={e => onExtraChange({ color: e.target.value })}
                  className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white p-1" />
              </label>
              {isButton && <label className="text-xs font-semibold text-slate-600">
                <span className="mb-2 block">{isBg ? "Цвят на бутона" : "Button color"}</span>
                <input type="color" value={extra.background} onChange={e => onExtraChange({ background: e.target.value })}
                  className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white p-1" />
              </label>}
              <label className="col-span-full text-xs font-semibold text-slate-600">
                <span className="mb-2 flex justify-between">{isBg ? "Размер на шрифта" : "Font size"} <b>{extra.fontSize} px</b></span>
                <input type="range" min={12} max={96} value={extra.fontSize} onChange={e => onExtraChange({ fontSize: Number(e.target.value) })}
                  className="w-full accent-[#18b99f]" />
              </label>
            </div>
          )}
          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{isBg ? "Позиция и мащабиране" : "Position and scale"}</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["x","y"] as const).map(axis =>
                <label key={axis} className="block text-xs font-semibold text-slate-600">
                  <span className="mb-1 block">{axis.toUpperCase()} (%)</span>
                  <input type="number" min={0} max={100} step={0.5} className={input}
                    value={Math.round((pos?.[axis] ?? (axis === "x" ? 25 : 24)) * 10) / 10}
                    onChange={e => updatePosition({ [axis]: Math.min(100, Math.max(0, Number(e.target.value))) })} />
                </label>)}
              <label className="block text-xs font-semibold text-slate-600">
                <span className="mb-1 block">{isBg ? "Мащаб (%)" : "Scale (%)"}</span>
                <input type="number" min={50} max={250} step={5} className={input}
                  value={Math.round((pos?.scale ?? 1) * 100)}
                  onChange={e => updatePosition({ scale: Math.min(2.5, Math.max(0.5, Number(e.target.value) / 100)) })} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { label: isBg ? "Ляво" : "Left", x: 5 },
                { label: isBg ? "Център X" : "Center X", x: 50 },
                { label: isBg ? "Дясно" : "Right", x: 80 },
              ]).map(item => <button key={item.label} type="button" onClick={() => updatePosition({ x: item.x })}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500">{item.label}</button>)}
              {([
                { label: isBg ? "Горе" : "Top", y: 5 },
                { label: isBg ? "Център Y" : "Center Y", y: 50 },
                { label: isBg ? "Долу" : "Bottom", y: 80 },
              ]).map(item => <button key={item.label} type="button" onClick={() => updatePosition({ y: item.y })}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500">{item.label}</button>)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            <TrashIcon className="h-4 w-4" />{isBg ? "Премахни" : "Remove"}
          </button>
          <button type="button" onClick={onClose} className="rounded-md bg-[#18b99f] px-5 py-2 text-sm font-bold text-white hover:bg-[#149f8a]">
            {isBg ? "Готово" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
