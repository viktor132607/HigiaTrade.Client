"use client";

type PreloadSlide = {
  isActive?: boolean;
  order?: number;
  image?: string;
};

export type PreloadedHomeSlideshowPayload = {
  slideDurationSeconds?: number;
  slides?: PreloadSlide[];
};

let cachedPayload: PreloadedHomeSlideshowPayload | null = null;
let preloadPromise: Promise<PreloadedHomeSlideshowPayload | null> | null = null;

const retainedImages = new Map<string, HTMLImageElement>();

const preloadImage = (url: string) =>
  new Promise<void>((resolve) => {
    const cached = retainedImages.get(url);

    if (cached?.complete && cached.naturalWidth > 0) {
      void cached.decode?.().catch(() => undefined).finally(resolve);
      return;
    }

    const image = cached ?? new Image();
    image.decoding = "async";

    const finish = () => {
      image.onload = null;
      image.onerror = null;
      void image.decode?.().catch(() => undefined).finally(resolve);
    };

    image.onload = finish;
    image.onerror = finish;

    if (!cached) {
      retainedImages.set(url, image);
      image.src = url;
    } else if (image.complete) {
      finish();
    }
  });

export const getPreloadedHomeSlideshow = () => cachedPayload;

export const preloadHomeSlideshow = () => {
  if (typeof window === "undefined") {
    return Promise.resolve<PreloadedHomeSlideshowPayload | null>(null);
  }

  if (cachedPayload) return Promise.resolve(cachedPayload);
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/home-slideshow`,
        { cache: "no-store" }
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as PreloadedHomeSlideshowPayload;
      const slides = Array.isArray(payload?.slides)
        ? payload.slides
            .filter((slide) => slide?.isActive !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : [];

      const imageUrls = [...new Set(slides.map((slide) => slide.image).filter((url): url is string => Boolean(url)))];
      await Promise.all(imageUrls.map(preloadImage));

      cachedPayload = payload;
      return payload;
    } catch {
      return null;
    } finally {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
};
