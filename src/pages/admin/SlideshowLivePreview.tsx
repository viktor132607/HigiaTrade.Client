import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Layout from "../../components/layout/Layout";
import Home from "../Home";
import type { PreviewConfig, HomeSlide, SlideField, SlidePosition } from "../../components/home/HomeHeroSlider";

type Incoming = {
  type: "hero-preview:update";
  slide: HomeSlide;
  index: number;
  total: number;
  selected?: SlideField | null;
  snapEnabled?: boolean;
};

const SlideshowLivePreview = () => {
  const [preview, setPreview] = useState<Incoming | null>(null);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!event.data || event.data.type !== "hero-preview:update" || !event.data.slide) return;
      setPreview(event.data as Incoming);
    };
    window.addEventListener("message", listener);
    window.parent.postMessage({ type: "hero-preview:ready" }, window.location.origin);
    return () => window.removeEventListener("message", listener);
  }, []);

  const send = (type: "hero-preview:move" | "hero-preview:select", fields: Record<string, unknown>) => {
    window.parent.postMessage({ type, ...fields }, window.location.origin);
  };

  const heroPreview: PreviewConfig | undefined = preview ? {
    slide: preview.slide,
    index: preview.index,
    total: preview.total,
    selected: preview.selected,
    snapEnabled: preview.snapEnabled,
    fullPage: true,
    onSelect: (key: SlideField) => send("hero-preview:select", { key }),
    onMove: (key: SlideField, pos: SlidePosition) => send("hero-preview:move", { key, pos }),
  } : undefined;

  // The editor is a preview, not a second shopping session. Links and buttons
  // remain visible but do not navigate away from the editable homepage.
  const preventNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("a, button")) event.preventDefault();
  };

  return <div onClickCapture={preventNavigation}>
    {heroPreview ? <Layout><Home heroPreview={heroPreview} /></Layout> :
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Зареждане на прегледа...
      </div>}
  </div>;
};

export default SlideshowLivePreview;
