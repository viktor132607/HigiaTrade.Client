import { useEffect, useState } from "react";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { Product } from "../types";

const BestSellers = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products/best-sellers?numOfBestSellers=100`
        );
        if (!response.ok) throw new Error("Unable to load best sellers.");

        const payload = await response.json();
        const items: Product[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        if (!cancelled) setProducts(items);
      } catch (error) {
        console.error("Грешка при зареждане на най-продаваните продукти:", error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
      <div className="site-container">
        <div className="mb-5 flex min-h-14 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#18b99f]">
              {isBg ? "Популярни продукти" : "Popular products"}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">
              {isBg ? "Най-продавани" : "Best sellers"}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            {isBg ? "Все още няма данни за най-продавани продукти." : "There is no best-seller data yet."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 min-[430px]:gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </main>
  );
};

export default BestSellers;
