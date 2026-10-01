import { useEffect, useState } from "react";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { Product } from "../types";

const Promotions = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500&SortBy=discountPercentage&SortDescending=true`
        );

        if (!response.ok) throw new Error("Unable to load promotions.");

        const data = await response.json();
        const items: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        const promoted = items
          .filter((product) => {
            const regular = Number(product.regularPrice ?? 0);
            const discounted = Number(product.discountedPrice ?? 0);
            const percent = Number(product.discountPercentage ?? 0);
            return product.isActive !== false && regular > 0 && (percent > 0 || (discounted > 0 && discounted < regular));
          })
          .sort((a, b) => Number(b.discountPercentage ?? 0) - Number(a.discountPercentage ?? 0));

        if (!cancelled) setProducts(promoted);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setError(isBg ? "Промоциите не можаха да бъдат заредени." : "Promotions could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isBg]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="mb-5 flex min-h-14 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">
              {isBg ? "Активни оферти" : "Active offers"}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">
              {isBg ? "Промоции" : "Promotions"}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-8 text-center text-rose-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            {isBg ? "В момента няма активни промоции." : "There are no active promotions at the moment."}
          </div>
        ) : (
          <div className="product-card-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </main>
  );
};

export default Promotions;
