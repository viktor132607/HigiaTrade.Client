import { useEffect } from "react";

type BrandOption = {
  name: string;
  thumbnailImageUrl?: string | null;
};

const SITE_DEFAULT_IMAGE = "/higiqlogo.png";

const ProductDefaultImagePreviewEnhancer = () => {
  useEffect(() => {
    let currentBrandSelect: HTMLSelectElement | null = null;
    let previewMount: HTMLDivElement | null = null;
    let previewImage: HTMLImageElement | null = null;
    let lastBrandKey = "__unresolved__";
    let requestId = 0;

    const loadPreviewForBrand = async (brandName: string) => {
      const normalizedBrand = brandName.trim();
      const brandKey = normalizedBrand.toLocaleLowerCase("bg-BG");
      if (brandKey === lastBrandKey && previewImage?.src) return;

      lastBrandKey = brandKey;
      const currentRequest = ++requestId;
      let imageUrl = SITE_DEFAULT_IMAGE;

      if (normalizedBrand) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`);
          if (response.ok) {
            const payload = await response.json();
            const brands: BrandOption[] = Array.isArray(payload) ? payload : [];
            const selectedBrand = brands.find(
              (item) =>
                item.name.trim().toLocaleLowerCase("bg-BG") === brandKey
            );
            imageUrl = selectedBrand?.thumbnailImageUrl?.trim() || SITE_DEFAULT_IMAGE;
          }
        } catch {
          imageUrl = SITE_DEFAULT_IMAGE;
        }
      }

      if (currentRequest !== requestId || !previewImage) return;
      previewImage.src = imageUrl;
      previewImage.alt = normalizedBrand
        ? `Default изображение за ${normalizedBrand}`
        : "Default изображение";
    };

    const detachBrandListener = () => {
      if (!currentBrandSelect) return;
      currentBrandSelect.removeEventListener("change", handleBrandChange);
      currentBrandSelect = null;
    };

    const handleBrandChange = () => {
      lastBrandKey = "__unresolved__";
      if (currentBrandSelect) {
        void loadPreviewForBrand(currentBrandSelect.value);
      }
    };

    const ensurePreview = () => {
      const brandMount = document.querySelector<HTMLElement>(
        "[data-product-brand-enhancer='true']"
      );
      const nextBrandSelect = brandMount?.querySelector<HTMLSelectElement>("select") ?? null;

      const imageLabel = Array.from(document.querySelectorAll("label")).find(
        (label) => label.textContent?.trim() === "Снимки на продукта"
      );
      const imageSection = imageLabel?.parentElement ?? null;

      if (!nextBrandSelect || !imageSection) {
        detachBrandListener();
        previewMount?.remove();
        previewMount = null;
        previewImage = null;
        lastBrandKey = "__unresolved__";
        return;
      }

      if (currentBrandSelect !== nextBrandSelect) {
        detachBrandListener();
        currentBrandSelect = nextBrandSelect;
        currentBrandSelect.addEventListener("change", handleBrandChange);
        lastBrandKey = "__unresolved__";
      }

      if (!previewMount || !previewMount.isConnected) {
        previewMount = document.createElement("div");
        previewMount.dataset.productDefaultImagePreview = "true";
        previewMount.className = "mt-4";

        const title = document.createElement("div");
        title.className = "mb-2 text-xs font-medium uppercase tracking-wide text-gray-500";
        title.textContent = "Default изображение — не се записва като продуктова снимка";

        const card = document.createElement("div");
        card.className = "w-40 overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 shadow-sm";

        const imageBox = document.createElement("div");
        imageBox.className = "aspect-square w-full overflow-hidden bg-white";

        previewImage = document.createElement("img");
        previewImage.src = SITE_DEFAULT_IMAGE;
        previewImage.alt = "Default изображение";
        previewImage.className = "h-full w-full object-contain";

        const footer = document.createElement("div");
        footer.className = "border-t border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-600";
        footer.textContent = "Default";

        imageBox.appendChild(previewImage);
        card.appendChild(imageBox);
        card.appendChild(footer);
        previewMount.appendChild(title);
        previewMount.appendChild(card);
        imageSection.appendChild(previewMount);
      }

      const hasUploadedImage = Boolean(
        imageSection.querySelector('input[name="mainProductImage"]')
      );
      previewMount.style.display = hasUploadedImage ? "none" : "block";

      if (!hasUploadedImage) {
        void loadPreviewForBrand(nextBrandSelect.value);
      }
    };

    ensurePreview();
    const observer = new MutationObserver(ensurePreview);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detachBrandListener();
      previewMount?.remove();
    };
  }, []);

  return null;
};

export default ProductDefaultImagePreviewEnhancer;
