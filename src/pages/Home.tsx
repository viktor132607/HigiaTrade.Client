import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import HomeHeroSlider from "../components/home/HomeHeroSlider";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface Category {
  id: string;
  name: string;
  imageURI?: string | null;
  imageUri?: string | null;
}

interface Product {
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
}

const Home = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [activeProductTab, setActiveProductTab] = useState<"best" | "popular" | "rating">("best");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [categoriesResponse, bestSellersResponse, latestResponse, catalogResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/best-sellers?numOfBestSellers=12`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=12&SortBy=createdOn&SortDescending=true`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=100&SortBy=title&SortDescending=false`),
        ]);

        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json();
          setCategories(Array.isArray(data) ? data : []);
        }
        if (bestSellersResponse.ok) {
          const data = await bestSellersResponse.json();
          setBestSellers(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
        }
        if (latestResponse.ok) {
          const data = await latestResponse.json();
          setLatestProducts(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
        }
        if (catalogResponse.ok) {
          const data = await catalogResponse.json();
          setCatalogProducts(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Home data fetch failed:", error);
      }
    };

    void fetchHomeData();
  }, []);

  const discountedProducts = useMemo(() =>
    catalogProducts
      .filter((product) => (product.discountPercentage ?? 0) > 0 && (product.discountedPrice ?? 0) > 0)
      .sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
      .slice(0, 4),
  [catalogProducts]);

  const tabProducts = useMemo(() => {
    if (activeProductTab === "rating") {
      return [...catalogProducts].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (activeProductTab === "popular") return latestProducts;
    return bestSellers;
  }, [activeProductTab, bestSellers, latestProducts, catalogProducts]);

  const text = {
    best: isBg ? "Най-продавани" : "Best sellers",
    popular: isBg ? "Последно добавени" : "Latest added",
    rating: isBg ? "Най-висок рейтинг" : "Highest rating",
    products: isBg ? "Продукти" : "Products",
    latest: isBg ? "Нови в каталога" : "New in the catalog",
    latestText: isBg ? "Последно добавените реални продукти от каталога." : "The latest real products added to the catalog.",
    promotions: isBg ? "Реални промоции" : "Current promotions",
    promotionText: isBg ? "Показваме само продукти с реално зададена отстъпка." : "Only products with an actual configured discount are shown.",
    categories: isBg ? "Категории" : "Categories",
    viewAll: isBg ? "Виж всички продукти" : "View all products",
    viewProducts: isBg ? "Виж продукти" : "View products",
    noCategoryImage: isBg ? "Няма изображение" : "No image",
    startShopping: isBg ? "Намери подходящите продукти за дома и бизнеса" : "Find the right products for home and business",
    startNow: isBg ? "Към каталога" : "Open catalog",
  };

  const steps = [
    { title: isBg ? "Избери продукти" : "Choose products", description: isBg ? "Търси по име, категория, марка, цена и рейтинг." : "Search by name, category, brand, price and rating.", icon: BuildingStorefrontIcon },
    { title: isBg ? "Провери наличността" : "Check stock", description: isBg ? "Виж актуалната наличност и цената на продукта." : "See current stock and product pricing.", icon: CheckBadgeIcon },
    { title: isBg ? "Завърши поръчката" : "Place the order", description: isBg ? "Въведи данните за доставка и потвърди поръчката." : "Enter delivery details and confirm the order.", icon: CreditCardIcon },
  ];

  const serviceItems = [
    { title: isBg ? "Поръчка по телефон" : "Phone orders", description: isBg ? "Бърза връзка за наличности и заявки." : "Fast contact for stock and orders.", icon: TruckIcon, color: "bg-emerald-500" },
    { title: isBg ? "Доставка" : "Delivery", description: isBg ? "Доставка според наличностите и адреса." : "Delivery based on stock and destination.", icon: ArrowRightIcon, color: "bg-sky-500" },
    { title: isBg ? "Актуални наличности" : "Current stock", description: isBg ? "Каталогът използва данните от системата за наличности." : "The catalog uses current inventory data.", icon: CheckBadgeIcon, color: "bg-yellow-400" },
    { title: isBg ? "Сигурен профил" : "Secure account", description: isBg ? "Управление на профил, поръчки и лични данни." : "Manage account, orders and personal data.", icon: ShieldCheckIcon, color: "bg-violet-500" },
  ];

  return (
    <div className="bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <HomeHeroSlider />

      <section className="border-b border-slate-200 bg-slate-50 py-3 transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-1 sm:flex-wrap sm:justify-center sm:px-6 sm:pb-0 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: "best" as const, label: text.best },
            { key: "popular" as const, label: text.popular },
            { key: "rating" as const, label: text.rating },
          ].map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveProductTab(tab.key)} className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition sm:px-6 ${activeProductTab === tab.key ? "bg-orange-500 text-white" : "bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-black"}`}>{tab.label}</button>
          ))}
        </div>
      </section>

      {tabProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 py-7 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {tabProducts.slice(0, 10).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-slate-900 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=1600&q=80)" }} />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative mx-auto max-w-7xl px-3 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">{text.startShopping}</h2>
          <div className="mt-7 grid gap-4 sm:mt-10 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl bg-white/95 p-5 text-slate-950 shadow-xl backdrop-blur sm:p-7 dark:bg-slate-950/90 dark:text-white">
                <step.icon className="mx-auto h-9 w-9 text-orange-500" />
                <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
          <Link to="/products" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-sm font-bold uppercase text-white hover:bg-orange-600 sm:mt-9">{text.startNow}</Link>
        </div>
      </section>

      {latestProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="text-center"><h2 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">{text.latest}</h2><p className="mx-auto mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-300">{text.latestText}</p></div>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:mt-8 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">{latestProducts.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-slate-50 transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-4 px-3 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {serviceItems.map((item) => <div key={item.title} className="flex items-center gap-3 sm:gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 ${item.color} text-white`}><item.icon className="h-6 w-6 sm:h-7 sm:w-7" /></div><div><h3 className="text-sm font-bold uppercase text-slate-950 dark:text-white">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{item.description}</p></div></div>)}
        </div>
      </section>

      {discountedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">{text.promotions}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{text.promotionText}</p></div><Link to="/products" className="text-sm font-semibold text-primary-600">{text.viewAll}</Link></div>
          <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">{discountedProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">{text.categories}</h2><Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">{text.viewAll}</Link></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.slice(0, 10).map((category) => {
              const image = category.imageUri ?? category.imageURI ?? "";
              return (
                <Link key={category.id} to={`/products?category=${encodeURIComponent(category.id)}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-black">
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">{image ? <img src={image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center p-2 text-center text-xs text-slate-400">{text.noCategoryImage}</div>}</div>
                  <div className="p-3 sm:p-4"><p className="line-clamp-2 text-sm font-bold text-slate-950 dark:text-white sm:text-base">{category.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{text.viewProducts}</p></div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-5 px-3 py-8 text-center sm:grid-cols-2 sm:px-6 sm:py-10 lg:grid-cols-4 lg:px-8">
          {[
            [isBg ? "Коректно обслужване" : "Reliable service", isBg ? "Ясна информация за продукти и поръчки." : "Clear information about products and orders.", CheckBadgeIcon],
            [isBg ? "Реални продукти" : "Real products", isBg ? "Каталогът идва от базата данни, без фиктивни артикули." : "Catalog data comes from the database without fake items.", BuildingStorefrontIcon],
            [isBg ? "Сигурно пазаруване" : "Secure shopping", isBg ? "Профил и поръчки в една система." : "Account and orders in one system.", ShieldCheckIcon],
            [isBg ? "Актуални цени" : "Current prices", isBg ? "Цени и наличности от текущите продуктови данни." : "Prices and stock from current product data.", CreditCardIcon],
          ].map(([title, description, Icon]) => {
            const ItemIcon = Icon as typeof CheckBadgeIcon;
            return <div key={String(title)}><ItemIcon className="mx-auto h-11 w-11 text-slate-600 dark:text-white sm:h-12 sm:w-12" /><h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white sm:text-xl">{String(title)}</h3><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-300">{String(description)}</p></div>;
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
