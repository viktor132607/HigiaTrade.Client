import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

type Brand = {
  name: string;
  productCount: number;
};

type Product = {
  id: string;
  title: string;
  brand?: string | null;
  categoryName?: string;
  regularPrice: number;
  discountedPrice: number;
  mainImageUrl?: string;
};

const Brands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoadingBrands(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`);
        if (!response.ok) throw new Error("Марките не можаха да бъдат заредени.");
        const data: Brand[] = await response.json();
        setBrands(data);
        if (data.length > 0) setSelectedBrand(data[0].name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Марките не можаха да бъдат заредени.");
      } finally {
        setLoadingBrands(false);
      }
    };

    void loadBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrand) {
      setProducts([]);
      return;
    }

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");
        const query = new URLSearchParams({
          Brand: selectedBrand,
          PageNumber: "1",
          PageSize: "100",
          SortBy: "title",
          SortDescending: "false",
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`);
        if (!response.ok) throw new Error("Продуктите не можаха да бъдат заредени.");
        const data = await response.json();
        setProducts(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Продуктите не можаха да бъдат заредени.");
      } finally {
        setLoadingProducts(false);
      }
    };

    void loadProducts();
  }, [selectedBrand]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">По марка</h1>
        <p className="mt-2 text-sm text-slate-500">Избери марка, за да видиш всички нейни продукти.</p>
      </div>

      {loadingBrands ? (
        <div className="py-16 text-center text-slate-500">Зареждане...</div>
      ) : brands.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Все още няма продукти с въведена марка.
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                key={brand.name}
                type="button"
                onClick={() => setSelectedBrand(brand.name)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  selectedBrand === brand.name
                    ? "border-[#18b99f] bg-[#18b99f] text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:border-[#18b99f]"
                }`}
              >
                {brand.name} <span className="opacity-70">({brand.productCount})</span>
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-950">{selectedBrand}</h2>
            <span className="text-sm text-slate-500">{products.length} продукта</span>
          </div>

          {error && <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {loadingProducts ? (
            <div className="py-16 text-center text-slate-500">Зареждане...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => {
                const price = product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="aspect-square bg-slate-50">
                      {product.mainImageUrl ? (
                        <img src={product.mainImageUrl} alt={product.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#18b99f]">
                        {product.brand || selectedBrand}
                      </div>
                      <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-950">{product.title}</h3>
                      <div className="mt-1 text-xs text-slate-500">{product.categoryName || ""}</div>
                      <div className="mt-3 font-bold text-slate-950">{formatCurrency(price)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Brands;
