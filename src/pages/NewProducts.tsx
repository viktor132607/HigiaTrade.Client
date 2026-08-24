import { useEffect, useState } from "react";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface NewProduct {
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
  isNewProduct?: boolean;
}

const NewProducts = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [products, setProducts] = useState<NewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/NewProducts?PageNumber=1&PageSize=100`
        );
        if (!response.ok) throw new Error("Unable to load new products.");

        const payload = await response.json();
        const items: NewProduct[] = Array.isArray(payload.items) ? payload.items : [];
        setProducts(items.map((product) => ({ ...product, isNewProduct: true })));
      } catch (error) {
        console.error("Грешка при зареждане на новите продукти:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-6 sm:py-10">
      <div className="site-container">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">
            {isBg ? "Ново" : "New"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
            {isBg ? "Нови стоки" : "New products"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isBg
              ? "Продукти, маркирани като нови за активния им период."
              : "Products currently marked as new for their configured display period."}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-14 text-center text-slate-600">
            {isBg
              ? "В момента няма продукти, маркирани като нови."
              : "There are currently no products marked as new."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProducts;
