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
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>(() => [
    ...(currentMainImageUrl?.trim()
      ? [{ uri: currentMainImageUrl.trim() }]
      : []),
    ...currentSecondaryImages.filter((image) => image.uri?.trim()),
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);

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

  const applyImages = (images: ProductImage[]) => {
    setUploadedImages(images);
    onImagesChange(images[0]?.uri ?? "", images.slice(1));
  };

  const moveItem = <T,>(items: T[], from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
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

      applyImages([...uploadedImages, ...uploaded]);
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
          className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
          className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">ДДС</label>
        <div className="mt-1 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="mb-2 font-semibold text-gray-900">Дребно</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                <div className="font-semibold">{retailBreakdown.gross.toFixed(2)} EUR</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700">
            <div className="mb-2 font-semibold text-gray-900">Едро</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                <div className="font-semibold">{wholesaleBreakdown.gross.toFixed(2)} EUR</div>
              </div>
            </div>
          </div>
        </div>
        <input type="hidden" name="vatRate" value={VAT_RATE} />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Качи снимки от устройството
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
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="button"
            onClick={uploadImages}
            disabled={uploading || selectedFiles.length === 0}
            className="shrink-0 rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Качване..." : "Качи снимки"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          JPEG, PNG, WEBP или GIF, до 5 MB на снимка. Първата снимка в подредбата е основна.
        </p>

        {selectedPreviews.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Избрани за качване — влачи за подреждане
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {selectedPreviews.map((preview, index) => (
                <div
                  key={`${selectedFiles[index]?.name}-${selectedFiles[index]?.lastModified}`}
                  draggable
                  onDragStart={() => setDraggedFileIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedFileIndex === null || draggedFileIndex === index) return;
                    setSelectedFiles((previous) =>
                      moveItem(previous, draggedFileIndex, index)
                    );
                    setDraggedFileIndex(null);
                  }}
                  className="cursor-move overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm"
                >
                  <img
                    src={preview}
                    alt={selectedFiles[index]?.name || `Снимка ${index + 1}`}
                    className="h-28 w-full object-cover"
                  />
                  <div className="truncate px-2 py-1.5 text-xs text-gray-600">
                    {index + 1}. {selectedFiles[index]?.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Снимки на продукта — влачи за подреждане
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {uploadedImages.map((image, index) => (
                <div
                  key={`${image.uri}-${index}`}
                  draggable
                  onDragStart={() => setDraggedImageIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedImageIndex === null || draggedImageIndex === index) return;
                    applyImages(moveItem(uploadedImages, draggedImageIndex, index));
                    setDraggedImageIndex(null);
                  }}
                  className="group relative cursor-move overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm"
                >
                  <img
                    src={image.uri}
                    alt={`Снимка ${index + 1}`}
                    className="h-32 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-gray-600">
                    <span className="truncate">
                      {index === 0 ? "Основна" : `Снимка ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        applyImages(uploadedImages.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                      title="Премахни"
                    >
                      ×
                    </button>
                  </div>
                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded bg-[#18b99f] px-2 py-1 text-[11px] font-semibold text-white">
                      Основна
                    </div>
                  )}
                </div>
              ))}
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
