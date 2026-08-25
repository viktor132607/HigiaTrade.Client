import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { slugifySeo } from "../utils/seo";

type Category = { id: string; name: string };
type Product = {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
  brand?: string;
  rating?: number;
  discountPercentage?: number;
  discountedPrice?: number;
};

const regions: Record<string, { bg: string; en: string }> = {
  ruse: { bg: "Русе", en: "Ruse" },
  silistra: { bg: "Силистра", en: "Silistra" },
  razgrad: { bg: "Разград", en: "Razgrad" },
  svishtov: { bg: "Свищов", en: "Svishtov" },
  byala: { bg: "Бяла", en: "Byala" },
  targovishte: { bg: "Търговище", en: "Targovishte" },
};

const RegionalCategory = () => {
  const { categorySlug = "", region = "" } = useParams<{ categorySlug?: string; region?: string }>();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const regionData = regions[region.toLowerCase()];
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const category = useMemo(
    () => categories.find((item) => slugifySeo(item.name, 90) === categorySlug.toLowerCase()) ?? null,
    [categories, categorySlug]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
      } catch {
        setError(isBg ? "Категориите не можаха да бъдат заредени." : "Categories could not be loaded.");
        setLoading(false);
      }
    };
    void loadCategories();
  }, [isBg]);

  useEffect(() => {
    if (!regionData || categories.length === 0) return;
    if (!category) {
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          CategoryId: category.id,
          PageNumber: "1",
          PageSize: "100",
          SortBy: "rating",
          SortDescending: "true",
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
      } catch {
        setError(isBg ? "Продуктите не можаха да бъдат заредени." : "Products could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    void loadProducts();
  }, [category, categories.length, isBg, regionData]);

  useEffect(() => {
    if (!category || !regionData) return;
    const regionName = isBg ? regionData.bg : regionData.en;
    document.title = `${category.name} ${isBg ? "за" : "for"} ${regionName} | HygiaTrade`;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = isBg
      ? `Доставка и запитвания за ${category.name} в ${regionName}. Продукти за дома, офиса, магазини и бизнес клиенти от HygiaTrade.`
      : `${category.name} delivery and enquiries in ${regionName}. Products for households, offices, shops and business customers from HygiaTrade.`;
  }, [category, isBg, regionData]);

  if (!regionData) {
    return <div className="site-container py-16 text-center text-slate-600">{isBg ? "Невалиден район." : "Invalid region."}</div>;
  }

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>;
  }

  if (!category) {
    return <div className="site-container py-16 text-center text-slate-600">{isBg ? "Тази регионална категория не съществува." : "This regional category does not exist."}</div>;
  }

  const regionName = isBg ? regionData.bg : regionData.en;
  const otherRegions = Object.entries(regions).filter(([slug]) => slug !== region.toLowerCase());

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 sm:py-12">
      <div className="site-container">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#148f7c]">HygiaTrade · {regionName}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {category.name} {isBg ? "за" : "for"} {regionName}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            {isBg
              ? `Актуални продукти от категория „${category.name}“ с възможност за запитване и доставка за ${regionName}. Страницата се генерира автоматично от реалния каталог и не използва фиктивни артикули.`
              : `Current products from the “${category.name}” category available for enquiries and delivery in ${regionName}. This page is generated from the live catalogue and contains no placeholder products.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/products?category=${category.id}`} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              {isBg ? "Отвори категорията" : "Open category"}
            </Link>
            <Link to="/contact" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">
              {isBg ? "Запитване за доставка" : "Delivery enquiry"}
            </Link>
          </div>
        </section>

        {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-950">{isBg ? "Продукти" : "Products"}</h2>
            <span className="text-sm text-slate-500">{products.length} {isBg ? "артикула" : "items"}</span>
          </div>
          {products.length ? (
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              {isBg ? "В момента няма активни продукти в тази категория." : "There are currently no active products in this category."}
            </div>
          )}
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-8">
          <h2 className="text-xl font-black text-slate-950">{isBg ? "Същата категория в други райони" : "The same category in other areas"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherRegions.map(([slug, data]) => (
              <Link key={slug} to={`/${categorySlug}/${slug}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#148f7c] hover:border-[#18b99f]">
                {isBg ? data.bg : data.en}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default RegionalCategory;