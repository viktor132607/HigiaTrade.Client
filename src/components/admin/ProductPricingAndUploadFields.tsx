import React, { useMemo, useState } from "react";

type Props = {
  token: string | null;
  regularPrice: string;
  defaultRetailPrice?: number;
  defaultWholesalePrice?: number;
  onImageUploaded: (url: string) => void;
};

const VAT_RATE = 20;

const ProductPricingAndUploadFields = ({
  token,
  regularPrice,
  defaultRetailPrice,
  defaultWholesalePrice,
  onImageUploaded,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const vatCalculation = useMemo(() => {
    const source = retailPrice.trim() !== "" ? retailPrice : regularPrice;
    const gross = Number.parseFloat(source) || 0;
    const net = gross > 0 ? gross / (1 + VAT_RATE / 100) : 0;
    const vat = gross - net;

    return {
      gross,
      net,
      vat,
    };
  }, [regularPrice, retailPrice]);

  const uploadImage = async () => {
    if (!selectedFile) {
      setUploadError("Избери снимка от устройството.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const body = new window.FormData();
      body.append("file", selectedFile);

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
        throw new Error(data?.message || "Снимката не беше качена.");
      }

      if (!data?.url) {
        throw new Error("Сървърът не върна адрес на снимката.");
      }

      onImageUploaded(String(data.url));
      setUploadedFileName(selectedFile.name);
      setSelectedFile(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Снимката не беше качена."
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
        <label className="block text-sm font-medium text-gray-700">
          ДДС
        </label>
        <div className="mt-1 grid grid-cols-1 gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-700 sm:grid-cols-3">
          <div>
            <span className="font-medium">Ставка:</span> {VAT_RATE}%
          </div>
          <div>
            <span className="font-medium">Без ДДС:</span>{" "}
            {vatCalculation.net.toFixed(2)} EUR
          </div>
          <div>
            <span className="font-medium">ДДС:</span>{" "}
            {vatCalculation.vat.toFixed(2)} EUR
          </div>
        </div>
        <input type="hidden" name="vatRate" value={VAT_RATE} />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Качи основна снимка от устройството
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setUploadError("");
              setUploadedFileName("");
            }}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="button"
            onClick={uploadImage}
            disabled={uploading || !selectedFile}
            className="shrink-0 rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Качване..." : "Качи снимка"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          JPEG, PNG, WEBP или GIF, до 5 MB. Снимката се записва в базата данни и попълва полето за основен URL.
        </p>
        {uploadedFileName && (
          <p className="mt-1 text-sm text-green-600">
            Качена: {uploadedFileName}
          </p>
        )}
        {uploadError && (
          <p className="mt-1 text-sm text-red-600">{uploadError}</p>
        )}
      </div>
    </>
  );
};

export default ProductPricingAndUploadFields;
