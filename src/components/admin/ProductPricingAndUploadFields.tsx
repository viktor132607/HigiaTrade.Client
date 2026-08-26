import React, { useEffect, useMemo, useRef, useState } from "react";

type ProductImage = {
  id?: string | null;
  uri: string;
};

type Props = {
  token: string | null;
  regularPrice: string;
  defaultRetailPrice?: number;
  defaultWholesalePrice?: number;
  currentMainImageUrl?: string;
  currentSecondaryImages?: ProductImage[];
  onImagesChange: (
    mainImageUrl: string,
    secondaryImages: ProductImage[]
  ) => void;
};

const VAT_RATE = 20;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const toNumber = (value: string | number | undefined) =>
  Math.max(0, Number.parseFloat(String(value ?? "")) || 0);

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundPercent = (value: number) => Math.round(value * 100) / 100;

const ProductPricingAndUploadFields = ({
  token,
  regularPrice,
  defaultRetailPrice,
  defaultWholesalePrice,
  currentMainImageUrl,
  currentSecondaryImages = [],
  onImagesChange,
}: Props) => {
  const initialMainImageUrl = currentMainImageUrl?.trim() ?? "";
  const initialImages: ProductImage[] = [
    ...(initialMainImageUrl ? [{ uri: initialMainImageUrl }] : []),
    ...currentSecondaryImages.filter(
      (image) => image.uri?.trim() && image.uri.trim() !== initialMainImageUrl
    ),
  ];

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [retailPrice, setRetailPrice] = useState(
    defaultRetailPrice && defaultRetailPrice > 0
      ? defaultRetailPrice.toString()
      : regularPrice || ""
  );
  const [wholesalePrice, setWholesalePrice] = useState(
    defaultWholesalePrice && defaultWholesalePrice > 0
      ? defaultWholesalePrice.toString()
      : ""
  );
  const [discountPercent, setDiscountPercent] = useState("0");

  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>(initialImages);
  const [mainImageUri, setMainImageUri] = useState(
    initialMainImageUrl || initialImages[0]?.uri || ""
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isUploadDropActive, setIsUploadDropActive] = useState(false);
  const [mobileOrdering, setMobileOrdering] = useState(false);
  const [mobileOrderSelection, setMobileOrderSelection] = useState<string[]>([]);

  const setReactInputValue = (name: string, value: string) => {
    if (typeof document === "undefined") return;

    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!input) return;

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  useEffect(() => {
    if (typeof document === "undefined") return;

    const regularInput = document.querySelector<HTMLInputElement>(
      'input[name="regularPrice"]'
    );
    const promoInput = document.querySelector<HTMLInputElement>(
      'input[name="discountedPrice"]'
    );
    const discountInput = document.querySelector<HTMLInputElement>(
      'input[name="discountPercentage"]'
    );

    [regularInput, promoInput, discountInput].forEach((input) => {
      const wrapper = input?.closest("div");
      if (wrapper) wrapper.style.display = "none";
    });

    const initialRetail = toNumber(defaultRetailPrice || regularInput?.value || regularPrice);
    const initialDiscount = Math.min(100, toNumber(discountInput?.value));

    if (initialRetail > 0) setRetailPrice(initialRetail.toString());
    setDiscountPercent(initialDiscount.toString());
  }, []);

  const retailBase = toNumber(retailPrice);
  const wholesaleBase = toNumber(wholesalePrice);
  const currentDiscount = Math.min(100, toNumber(discountPercent));

  const retailPromo = roundMoney(retailBase * (1 - currentDiscount / 100));
  const wholesalePromo = roundMoney(wholesaleBase * (1 - currentDiscount / 100));
  const retailSavings = roundMoney(retailBase - retailPromo);
  const wholesaleSavings = roundMoney(wholesaleBase - wholesalePromo);

  const retailBreakdown = useMemo(() => {
    const gross = currentDiscount > 0 ? retailPromo : retailBase;
    const net = gross > 0 ? gross / (1 + VAT_RATE / 100) : 0;
    return { gross, net, vat: gross - net };
  }, [retailBase, retailPromo, currentDiscount]);

  const wholesaleBreakdown = useMemo(() => {
    const gross = currentDiscount > 0 ? wholesalePromo : wholesaleBase;
    const net = gross > 0 ? gross / (1 + VAT_RATE / 100) : 0;
    return { gross, net, vat: gross - net };
  }, [wholesaleBase, wholesalePromo, currentDiscount]);

  const syncDiscount = (percent: number) => {
    const normalized = Math.min(100, Math.max(0, roundPercent(percent)));
    const text = normalized.toString();
    setDiscountPercent(text);
    setReactInputValue("discountPercentage", text);

    const promo = normalized > 0
      ? roundMoney(retailBase * (1 - normalized / 100))
      : 0;
    setReactInputValue("discountedPrice", promo.toString());
  };

  const handleRetailPriceChange = (value: string) => {
    setRetailPrice(value);
    setReactInputValue("regularPrice", value);

    const base = toNumber(value);
    const promo = currentDiscount > 0
      ? roundMoney(base * (1 - currentDiscount / 100))
      : 0;
    setReactInputValue("discountedPrice", promo.toString());
  };

  const handlePromoPriceChange = (kind: "retail" | "wholesale", value: string) => {
    const base = kind === "retail" ? retailBase : wholesaleBase;
    if (base <= 0) {
      syncDiscount(0);
      return;
    }

    const promo = Math.min(base, toNumber(value));
    syncDiscount(((base - promo) / base) * 100);
  };

  const handleSavingsChange = (kind: "retail" | "wholesale", value: string) => {
    const base = kind === "retail" ? retailBase : wholesaleBase;
    if (base <= 0) {
      syncDiscount(0);
      return;
    }

    const savings = Math.min(base, toNumber(value));
    syncDiscount((savings / base) * 100);
  };

  const priceInputClass =
    "w-full min-w-0 rounded-md border border-slate-500 bg-white px-2 py-2 text-right text-sm text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20";

  const readOnlyCellClass =
    "rounded-md bg-slate-50 px-2 py-2 text-right text-sm font-medium text-slate-800";

  const notifyImagesChange = (
    images: ProductImage[],
    preferredMainImageUri = mainImageUri
  ) => {
    const cleanImages = images.filter((image) => image.uri?.trim());
    const resolvedMainImageUri = cleanImages.some(
      (image) => image.uri === preferredMainImageUri
    )
      ? preferredMainImageUri
      : cleanImages[0]?.uri ?? "";
    const mainImage = cleanImages.find((image) => image.uri === resolvedMainImageUri);
    const orderedImages = mainImage
      ? [mainImage, ...cleanImages.filter((image) => image.uri !== resolvedMainImageUri)]
      : cleanImages;

    setUploadedImages(orderedImages);
    setMainImageUri(resolvedMainImageUri);
    onImagesChange(
      resolvedMainImageUri,
      orderedImages.filter((image) => image.uri !== resolvedMainImageUri)
    );
  };

  const setMainImage = (image: ProductImage) => {
    notifyImagesChange(uploadedImages, image.uri);
  };

  const moveItem = <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const removeUploadedImage = (index: number) => {
    const image = uploadedImages[index];
    setMobileOrderSelection((previous) =>
      previous.filter((uri) => uri !== image?.uri)
    );
    notifyImagesChange(
      uploadedImages.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const toggleMobileOrderSelection = (image: ProductImage) => {
    if (!mobileOrdering) return;

    setMobileOrderSelection((previous) => {
      if (previous.includes(image.uri)) {
        return previous.filter((uri) => uri !== image.uri);
      }
      return [...previous, image.uri];
    });
  };

  const applyMobileOrder = () => {
    if (mobileOrderSelection.length === 0) {
      setMobileOrdering(false);
      return;
    }

    const selectedImages = mobileOrderSelection
      .map((uri) => uploadedImages.find((image) => image.uri === uri))
      .filter((image): image is ProductImage => Boolean(image));
    const remainingImages = uploadedImages.filter(
      (image) => !mobileOrderSelection.includes(image.uri)
    );

    notifyImagesChange([...selectedImages, ...remainingImages]);
    setMobileOrderSelection([]);
    setMobileOrdering(false);
  };

  const cancelMobileOrder = () => {
    setMobileOrderSelection([]);
    setMobileOrdering(false);
  };

  const uploadImages = async (files: File[]) => {
    if (files.length === 0 || uploading) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setUploadError("Добави поне един валиден файл с изображение.");
      return;
    }

    const oversizedFile = imageFiles.find((file) => file.size > MAX_IMAGE_SIZE);
    if (oversizedFile) {
      setUploadError(`Снимката ${oversizedFile.name} е по-голяма от 10 MB.`);
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const uploaded: ProductImage[] = [];

      for (const file of imageFiles) {
        const body = new window.FormData();
        body.append("file", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Images/upload`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body,
          }
        );

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || `Снимката ${file.name} не беше качена.`);
        }
        if (!data?.url) {
          throw new Error(`Сървърът не върна адрес за ${file.name}.`);
        }

        uploaded.push({ uri: String(data.url) });
      }

      const nextImages = [...uploadedImages, ...uploaded];
      notifyImagesChange(nextImages);

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 639px)").matches &&
        nextImages.length > 1
      ) {
        setMobileOrderSelection([]);
        setMobileOrdering(true);
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Снимките не бяха качени."
      );
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData || uploading) return;

      const pastedImages = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

      if (pastedImages.length === 0) return;
      event.preventDefault();
      void uploadImages(pastedImages);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [uploadedImages, mainImageUri, uploading, token]);

  return (
    <>
      <div>
        <div className="mb-2 text-sm font-semibold text-gray-900">Цени</div>
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] border-b border-slate-300 bg-slate-100">
            <div className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Поле</div>
            <div className="border-l border-slate-300 px-2 py-3 text-center text-sm font-bold text-slate-900">Цена на дребно</div>
            <div className="border-l border-slate-300 px-2 py-3 text-center text-sm font-bold text-slate-900">Цена на едро</div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm font-medium text-slate-700">Редовна цена с ДДС</div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" name="retailPrice" value={retailPrice} onChange={(event) => handleRetailPriceChange(event.target.value)} className={priceInputClass} />
            </div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" name="wholesalePrice" value={wholesalePrice} onChange={(event) => setWholesalePrice(event.target.value)} className={priceInputClass} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm font-medium text-slate-700">Промоционална цена</div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" value={retailPromo || ""} onChange={(event) => handlePromoPriceChange("retail", event.target.value)} className={priceInputClass} />
            </div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" value={wholesalePromo || ""} onChange={(event) => handlePromoPriceChange("wholesale", event.target.value)} className={priceInputClass} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm font-medium text-slate-700">
              Клиентът спестява
              <div className="text-xs font-normal text-slate-500">Сумата на отстъпката в EUR</div>
            </div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" value={retailSavings || ""} onChange={(event) => handleSavingsChange("retail", event.target.value)} className={priceInputClass} />
            </div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" value={wholesaleSavings || ""} onChange={(event) => handleSavingsChange("wholesale", event.target.value)} className={priceInputClass} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm font-medium text-slate-700">Отстъпка (%)</div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" max="100" value={discountPercent} onChange={(event) => syncDiscount(toNumber(event.target.value))} className={priceInputClass} />
            </div>
            <div className="border-l border-slate-200 p-2">
              <input type="number" inputMode="decimal" step="0.01" min="0" max="100" value={discountPercent} onChange={(event) => syncDiscount(toNumber(event.target.value))} className={priceInputClass} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm text-slate-700">Цена без ДДС</div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{retailBreakdown.net.toFixed(2)} EUR</div></div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{wholesaleBreakdown.net.toFixed(2)} EUR</div></div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm text-slate-700">ДДС сума</div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{retailBreakdown.vat.toFixed(2)} EUR</div></div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{wholesaleBreakdown.vat.toFixed(2)} EUR</div></div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center border-b border-slate-200">
            <div className="px-3 py-3 text-sm font-semibold text-slate-800">Крайна цена с ДДС</div>
            <div className="border-l border-slate-200 p-2"><div className={`${readOnlyCellClass} font-bold`}>{retailBreakdown.gross.toFixed(2)} EUR</div></div>
            <div className="border-l border-slate-200 p-2"><div className={`${readOnlyCellClass} font-bold`}>{wholesaleBreakdown.gross.toFixed(2)} EUR</div></div>
          </div>

          <div className="grid grid-cols-[minmax(118px,1.25fr)_minmax(100px,1fr)_minmax(100px,1fr)] items-center">
            <div className="px-3 py-3 text-sm text-slate-700">ДДС ставка</div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{VAT_RATE}%</div></div>
            <div className="border-l border-slate-200 p-2"><div className={readOnlyCellClass}>{VAT_RATE}%</div></div>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Промени промоционалната цена, сумата „Клиентът спестява“ или процента — останалите полета се преизчисляват автоматично. Един и същ процент отстъпка се прилага за дребно и едро.
        </p>
        <input type="hidden" name="vatRate" value={VAT_RATE} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Снимки на продукта</label>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={uploading}
          accept="image/*"
          onChange={(event) => {
            const input = event.currentTarget;
            const files = Array.from(input.files ?? []);
            input.value = "";
            setUploadError("");
            void uploadImages(files);
          }}
          className="hidden"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!uploading) fileInputRef.current?.click();
          }}
          onKeyDown={(event) => {
            if (!uploading && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!uploading) setIsUploadDropActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            if (!uploading) setIsUploadDropActive(true);
          }}
          onDragLeave={() => setIsUploadDropActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsUploadDropActive(false);
            if (uploading) return;
            const files = Array.from(event.dataTransfer.files ?? []);
            setUploadError("");
            void uploadImages(files);
          }}
          className={`mt-1 flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition focus:outline-none focus:ring-2 focus:ring-[#18b99f]/30 ${
            isUploadDropActive
              ? "scale-[1.01] border-[#18b99f] bg-emerald-50 ring-2 ring-[#18b99f]/20"
              : "border-slate-400 bg-white hover:border-[#18b99f] hover:bg-emerald-50"
          } ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <div className="text-sm font-semibold text-gray-900 sm:text-base">
            {uploading
              ? "Качване..."
              : isUploadDropActive
                ? "Пусни снимките тук"
                : "Избери снимки, пусни ги тук или натисни Ctrl+V"}
          </div>
          {!uploading && (
            <div className="mt-1 text-xs text-gray-500 sm:text-sm">
              Галерия / File Explorer / буфер за копиране
            </div>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          До 10 MB на снимка. Файловете се качват автоматично веднага след избор, пускане или поставяне от буфера.
        </p>

        {uploadedImages.length > 1 && !mobileOrdering && (
          <button
            type="button"
            onClick={() => {
              setMobileOrderSelection([]);
              setMobileOrdering(true);
            }}
            className="mt-3 w-full rounded-md border border-[#18b99f] px-3 py-2 text-sm font-semibold text-[#138b78] sm:hidden"
          >
            Подреди снимките чрез избор 1, 2, 3...
          </button>
        )}

        {mobileOrdering && (
          <div className="mt-3 rounded-lg border border-[#18b99f]/40 bg-emerald-50 p-3 sm:hidden">
            <div className="text-sm font-semibold text-gray-900">Натискай снимките в желания ред: 1, 2, 3...</div>
            <div className="mt-1 text-xs text-gray-600">Номерът върху снимката показва избраната позиция.</div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={cancelMobileOrder} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">Отказ</button>
              <button type="button" onClick={applyMobileOrder} disabled={mobileOrderSelection.length === 0} className="flex-1 rounded-md bg-[#18b99f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Готово</button>
            </div>
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">
              Качени снимки — плъзни карта върху желаното място
            </div>
            <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
              {uploadedImages.map((image, index) => {
                const isMain = image.uri === mainImageUri;
                const isDragging = draggedImageIndex === index;
                const isDropTarget = dragOverImageIndex === index && draggedImageIndex !== index;
                const mobileRank = mobileOrderSelection.indexOf(image.uri) + 1;

                return (
                  <div
                    key={`${image.uri}-${index}`}
                    draggable={!mobileOrdering}
                    onClick={() => toggleMobileOrderSelection(image)}
                    onDragStart={(event) => {
                      if (mobileOrdering) return;
                      setDraggedImageIndex(index);
                      setDragOverImageIndex(index);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", String(index));
                    }}
                    onDragEnter={(event) => {
                      if (mobileOrdering) return;
                      event.preventDefault();
                      if (draggedImageIndex !== null) setDragOverImageIndex(index);
                    }}
                    onDragOver={(event) => {
                      if (mobileOrdering) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      if (mobileOrdering) return;
                      event.preventDefault();

                      if (draggedImageIndex === null || draggedImageIndex === index) {
                        setDraggedImageIndex(null);
                        setDragOverImageIndex(null);
                        return;
                      }

                      notifyImagesChange(moveItem(uploadedImages, draggedImageIndex, index));
                      setDraggedImageIndex(null);
                      setDragOverImageIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedImageIndex(null);
                      setDragOverImageIndex(null);
                    }}
                    className={`relative overflow-hidden rounded-md border bg-white shadow-sm transition-all duration-150 sm:cursor-grab sm:active:cursor-grabbing ${
                      mobileOrdering ? "cursor-pointer" : ""
                    } ${
                      isMain ? "border-[#18b99f] ring-2 ring-[#18b99f]/20" : "border-gray-300"
                    } ${
                      isDropTarget ? "scale-[1.02] border-[#18b99f] ring-2 ring-[#18b99f]/40" : ""
                    } ${isDragging ? "opacity-45" : "opacity-100"}`}
                  >
                    {isDropTarget && (
                      <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center bg-emerald-50/75 sm:flex">
                        <span className="rounded-md bg-[#18b99f] px-3 py-1.5 text-xs font-semibold text-white shadow">Пусни тук</span>
                      </div>
                    )}

                    <div className="absolute left-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/75 px-2 text-xs font-bold text-white shadow">
                      {mobileOrdering ? (mobileRank > 0 ? mobileRank : "") : index + 1}
                    </div>

                    <div className="hidden select-none items-center justify-center border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 sm:flex">☰ Плъзни за подреждане</div>

                    <div className="aspect-square w-full overflow-hidden bg-slate-50">
                      <img src={image.uri} alt={`Снимка ${index + 1}`} draggable={false} className="h-full w-full select-none object-contain" />
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-2 py-2" onClick={(event) => event.stopPropagation()}>
                      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-gray-800 sm:text-sm">
                        <input type="radio" name="mainProductImage" checked={isMain} onChange={() => setMainImage(image)} className="h-4 w-4 border-gray-400 text-[#18b99f] focus:ring-[#18b99f]" />
                        Основна
                      </label>

                      <button type="button" onClick={() => removeUploadedImage(index)} className="min-h-10 min-w-10 rounded px-2 text-red-600 hover:bg-red-50" title="Премахни снимката">×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </div>
    </>
  );
};

export default ProductPricingAndUploadFields;
