import React, { useEffect, useMemo, useState } from "react";

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>(initialImages);
  const [mainImageUri, setMainImageUri] = useState(
    initialMainImageUrl || initialImages[0]?.uri || ""
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setSelectedPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [selectedFiles]);

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

  const moveUploadedImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= uploadedImages.length) return;
    notifyImagesChange(moveItem(uploadedImages, index, target));
  };

  const removeUploadedImage = (index: number) => {
    notifyImagesChange(
      uploadedImages.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Избери поне една снимка от устройството.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const uploaded: ProductImage[] = [];

      for (const file of selectedFiles) {
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

      notifyImagesChange([...uploadedImages, ...uploaded]);
      setSelectedFiles([]);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Снимките не бяха качени."
      );
    } finally {
      setUploading(false);
    }
  };

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
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              setSelectedFiles(Array.from(event.target.files ?? []));
              setUploadError("");
            }}
            className="block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="button"
            onClick={uploadImages}
            disabled={uploading || selectedFiles.length === 0}
            className="min-h-11 shrink-0 rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Качване..." : "Качи снимки"}
          </button>
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          JPEG, PNG, WEBP или GIF, до 5 MB на снимка. След качване избери коя снимка да е основна.
        </p>

        {selectedPreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {selectedPreviews.map((preview, index) => (
              <div
                key={`${selectedFiles[index]?.name}-${selectedFiles[index]?.lastModified}`}
                className="overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm"
              >
                <img
                  src={preview}
                  alt={selectedFiles[index]?.name || `Снимка ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                <div className="truncate px-2 py-2 text-xs text-gray-600">
                  {selectedFiles[index]?.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Качени снимки — избери основна и подреди при нужда
            </div>
            <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {uploadedImages.map((image, index) => {
                const isMain = image.uri === mainImageUri;

                return (
                  <div
                    key={`${image.uri}-${index}`}
                    draggable
                    onDragStart={() => setDraggedImageIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (
                        draggedImageIndex === null ||
                        draggedImageIndex === index
                      ) {
                        return;
                      }

                      notifyImagesChange(
                        moveItem(uploadedImages, draggedImageIndex, index)
                      );
                      setDraggedImageIndex(null);
                    }}
                    className={`overflow-hidden rounded-md border bg-white shadow-sm sm:cursor-move ${
                      isMain ? "border-[#18b99f] ring-2 ring-[#18b99f]/20" : "border-gray-300"
                    }`}
                  >
                    <img
                      src={image.uri}
                      alt={`Снимка ${index + 1}`}
                      className="h-40 w-full object-cover sm:h-32"
                    />

                    <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-2 py-2">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
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
                        className="min-h-11 min-w-11 rounded px-2 text-red-600 hover:bg-red-50"
                        title="Премахни снимката"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex gap-2 px-2 pb-2">
                      <button
                        type="button"
                        onClick={() => moveUploadedImage(index, -1)}
                        disabled={index === 0}
                        className="min-h-11 flex-1 rounded border border-gray-300 text-sm disabled:opacity-40"
                        aria-label="Премести снимката наляво"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveUploadedImage(index, 1)}
                        disabled={index === uploadedImages.length - 1}
                        className="min-h-11 flex-1 rounded border border-gray-300 text-sm disabled:opacity-40"
                        aria-label="Премести снимката надясно"
                      >
                        →
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
