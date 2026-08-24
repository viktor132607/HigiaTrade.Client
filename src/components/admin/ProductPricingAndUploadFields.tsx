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
      : ""
  );
  const [wholesalePrice, setWholesalePrice] = useState(
    defaultWholesalePrice && defaultWholesalePrice > 0
      ? defaultWholesalePrice.toString()
      : ""
  );
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

  const retailBreakdown = useMemo(() => {
    const source = retailPrice.trim() !== "" ? retailPrice : regularPrice;
    const gross = Math.max(0, Number.parseFloat(source) || 0);
    const net = gross > 0 ? gross / (1 + VAT_RATE / 100) : 0;

    return {
      gross,
      net,
      vat: gross - net,
    };
  }, [regularPrice, retailPrice]);

  const wholesaleBreakdown = useMemo(() => {
    const gross = Math.max(0, Number.parseFloat(wholesalePrice) || 0);
    const net = gross > 0 ? gross / (1 + VAT_RATE / 100) : 0;

    return {
      gross,
      net,
      vat: gross - net,
    };
  }, [wholesalePrice]);

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

    setUploadedImages(cleanImages);
    setMainImageUri(resolvedMainImageUri);
    onImagesChange(
      resolvedMainImageUri,
      cleanImages.filter((image) => image.uri !== resolvedMainImageUri)
    );
  };

  const setMainImage = (image: ProductImage) => {
    setMainImageUri(image.uri);
    onImagesChange(
      image.uri,
      uploadedImages.filter((item) => item.uri !== image.uri)
    );
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
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
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
        .filter(
          (item) => item.kind === "file" && item.type.startsWith("image/")
        )
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
        <label className="block text-sm font-medium text-gray-700">
          Цена на дребно (EUR) - по избор
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          name="retailPrice"
          value={retailPrice}
          onChange={(event) => setRetailPrice(event.target.value)}
          className="mt-1 block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Цена на едро (EUR) - по избор
        </label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          name="wholesalePrice"
          value={wholesalePrice}
          onChange={(event) => setWholesalePrice(event.target.value)}
          className="mt-1 block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">ДДС</label>
        <div className="mt-1 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="mb-2 font-semibold text-gray-900">Дребно</div>
            <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:grid-cols-4">
              <div>
                <div className="text-xs text-gray-500">Ставка</div>
                <div>{VAT_RATE}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Без ДДС</div>
                <div>{retailBreakdown.net.toFixed(2)} EUR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ДДС</div>
                <div>{retailBreakdown.vat.toFixed(2)} EUR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Крайна с ДДС</div>
                <div className="font-semibold">
                  {retailBreakdown.gross.toFixed(2)} EUR
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="mb-2 font-semibold text-gray-900">Едро</div>
            <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:grid-cols-4">
              <div>
                <div className="text-xs text-gray-500">Ставка</div>
                <div>{VAT_RATE}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Без ДДС</div>
                <div>{wholesaleBreakdown.net.toFixed(2)} EUR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ДДС</div>
                <div>{wholesaleBreakdown.vat.toFixed(2)} EUR</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Крайна с ДДС</div>
                <div className="font-semibold">
                  {wholesaleBreakdown.gross.toFixed(2)} EUR
                </div>
              </div>
            </div>
          </div>
        </div>
        <input type="hidden" name="vatRate" value={VAT_RATE} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Снимки на продукта
        </label>

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
            if (
              !uploading &&
              (event.key === "Enter" || event.key === " ")
            ) {
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
            <div className="text-sm font-semibold text-gray-900">
              Натискай снимките в желания ред: 1, 2, 3...
            </div>
            <div className="mt-1 text-xs text-gray-600">
              Номерът върху снимката показва избраната позиция.
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={cancelMobileOrder}
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              >
                Отказ
              </button>
              <button
                type="button"
                onClick={applyMobileOrder}
                disabled={mobileOrderSelection.length === 0}
                className="flex-1 rounded-md bg-[#18b99f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Готово
              </button>
            </div>
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:block">
              Качени снимки — плъзни карта върху желаното място
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {uploadedImages.map((image, index) => {
                const isMain = image.uri === mainImageUri;
                const isDragging = draggedImageIndex === index;
                const isDropTarget =
                  dragOverImageIndex === index && draggedImageIndex !== index;
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
                      if (draggedImageIndex !== null) {
                        setDragOverImageIndex(index);
                      }
                    }}
                    onDragOver={(event) => {
                      if (mobileOrdering) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      if (mobileOrdering) return;
                      event.preventDefault();

                      if (
                        draggedImageIndex === null ||
                        draggedImageIndex === index
                      ) {
                        setDraggedImageIndex(null);
                        setDragOverImageIndex(null);
                        return;
                      }

                      notifyImagesChange(
                        moveItem(uploadedImages, draggedImageIndex, index)
                      );
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
                      isMain
                        ? "border-[#18b99f] ring-2 ring-[#18b99f]/20"
                        : "border-gray-300"
                    } ${
                      isDropTarget
                        ? "scale-[1.02] border-[#18b99f] ring-2 ring-[#18b99f]/40"
                        : ""
                    } ${isDragging ? "opacity-45" : "opacity-100"}`}
                  >
                    {isDropTarget && (
                      <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-center bg-emerald-50/75 sm:flex">
                        <span className="rounded-md bg-[#18b99f] px-3 py-1.5 text-xs font-semibold text-white shadow">
                          Пусни тук
                        </span>
                      </div>
                    )}

                    <div className="absolute left-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/75 px-2 text-xs font-bold text-white shadow">
                      {mobileOrdering
                        ? mobileRank > 0
                          ? mobileRank
                          : ""
                        : index + 1}
                    </div>

                    <div className="hidden select-none items-center justify-center border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 sm:flex">
                      ☰ Плъзни за подреждане
                    </div>

                    <img
                      src={image.uri}
                      alt={`Снимка ${index + 1}`}
                      draggable={false}
                      className="aspect-square w-full select-none object-cover sm:h-32 sm:aspect-auto"
                    />

                    <div
                      className="flex items-center justify-between gap-2 border-t border-gray-200 px-2 py-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-medium text-gray-800 sm:text-sm">
                        <input
                          type="radio"
                          name="mainProductImage"
                          checked={isMain}
                          onChange={() => setMainImage(image)}
                          className="h-4 w-4 border-gray-400 text-[#18b99f] focus:ring-[#18b99f]"
                        />
                        Основна
                      </label>

                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="min-h-10 min-w-10 rounded px-2 text-red-600 hover:bg-red-50"
                        title="Премахни снимката"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
      </div>
    </>
  );
};

export default ProductPricingAndUploadFields;
