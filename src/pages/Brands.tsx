import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

type Brand = {
  id: string;
  name: string;
  thumbnailImageUrl?: string | null;
  description?: string | null;
  productCount: number;
};

type Product = {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
  rating?: number;
  discountPercentage?: number;
  discountedPrice?: number;
};

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

const brandSlug = (value: string) =>
  value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "brand";

const Brands = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const navigate = useNavigate();
  const { brandSlug: routeBrandSlug } = useParams<{ brandSlug?: string }>();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoadingBrands(true);
        setError("");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`);
        if (!response.ok) throw new Error(isBg ? "Марките не можаха да бъдат заредени." : "Brands could not be loaded.");
        const data: Brand[] = await response.json();
        setBrands(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : isBg ? "Марките не можаха да бъдат заредени." : "Brands could not be loaded.");
      } finally {
        setLoadingBrands(false);
      }
    };

    void loadBrands();
  }, [isBg]);

  useEffect(() => {
    if (!routeBrandSlug) {
      setSelectedBrand(null);
      return;
    }

    const matchingBrand = brands.find((brand) => brandSlug(brand.name) === routeBrandSlug.toLowerCase());
    setSelectedBrand(matchingBrand ?? null);
  }, [brands, routeBrandSlug]);

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
          Brand: selectedBrand.name,
          PageNumber: "1",
          PageSize: "100",
          SortBy: "title",
          SortDescending: "false",
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`);
        if (!response.ok) throw new Error(isBg ? "Продуктите не можаха да бъдат заредени." : "Products could not be loaded.");
        const data = await response.json();
        setProducts(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : isBg ? "Продуктите не можаха да бъдат заредени." : "Products could not be loaded.");
      } finally {
        setLoadingProducts(false);
      }
    };

    void loadProducts();
  }, [selectedBrand, isBg]);

  const chooseBrand = (brand: Brand, active: boolean) => {
    if (active) {
      navigate("/brands");
      return;
    }

    navigate(`/brands/${brandSlug(brand.name)}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 sm:py-12">
      <div className="site-container">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#18b99f]">
            {isBg ? "Нашите партньори" : "Our partners"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {selectedBrand ? selectedBrand.name : isBg ? "Марки" : "Brands"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            {selectedBrand?.description || (isBg
              ? "Разгледай портфолиото ни от марки и продуктите, които предлагаме от всяка от тях."
              : "Browse our brand portfolio and the products we offer from each brand.")}
          </p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loadingBrands ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#18b99f]" />
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            {isBg ? "Все още няма добавени марки." : "No brands have been added yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => {
              const active = selectedBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => chooseBrand(brand, active)}
                  className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    active ? "border-[#18b99f] ring-2 ring-[#18b99f]/20" : "border-slate-200"
                  }`}
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    {brand.thumbnailImageUrl ? (
                      <img
                        src={brand.thumbnailImageUrl}
                        alt={brand.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-bold text-slate-300">
                        {brand.name}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-950">{brand.name}</h2>
                      <span className="shrink-0 rounded-full bg-[#18b99f]/10 px-2.5 py-1 text-xs font-bold text-[#159681]">
                        {brand.productCount}
                      </span>
                    </div>
                    {brand.description ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{brand.description}</p>
                    ) : null}
                    <p className="mt-4 text-sm font-semibold text-[#18b99f]">
                      {active
                        ? isBg ? "Скрий продуктите" : "Hide products"
                        : isBg ? "Виж продуктите" : "View products"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {routeBrandSlug && !loadingBrands && brands.length > 0 && !selectedBrand && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            {isBg ? "Тази марка вече не е активна или не съществува." : "This brand is no longer active or does not exist."}
          </div>
        )}

        {selectedBrand && (
          <section className="mt-12 border-t border-slate-200 pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18b99f]">
                  {isBg ? "Продукти на марката" : "Brand products"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">{selectedBrand.name}</h2>
              </div>
              <span className="text-sm text-slate-500">
                {isBg ? `${products.length} продукта` : `${products.length} products`}
              </span>
            </div>

            {loadingProducts ? (
              <div className="flex min-h-52 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#18b99f]" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                {isBg ? "Няма активни продукти от тази марка." : "There are no active products from this brand."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Brands;
