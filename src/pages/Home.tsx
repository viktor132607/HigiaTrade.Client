import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  HomeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import HomeHeroSlider from "../components/home/HomeHeroSlider";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_LINK } from "../config/contact";
import { categorySeoPath } from "../utils/seo";

interface Category {
  id: string;
  name: string;
  imageURI?: string | null;
  imageUri?: string | null;
  parentCategoryId?: string | null;
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

  const mainCategories = useMemo(
    () => categories.filter((category) => !category.parentCategoryId),
    [categories]
  );

  const discountedProducts = useMemo(() =>
    catalogProducts
      .filter((product) => (product.discountPercentage ?? 0) > 0 && (product.discountedPrice ?? 0) > 0)
      .sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
      .slice(0, 5),
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
    latest: isBg ? "Нови продукти" : "New products",
    promotions: isBg ? "Промоции" : "Promotions",
    categories: isBg ? "Категории" : "Categories",
    viewAll: isBg ? "Виж всички продукти" : "View all products",
    viewProducts: isBg ? "Виж продукти" : "View products",
    noCategoryImage: isBg ? "Няма изображение" : "No image",
    startShopping: isBg ? "Намери подходящите продукти за дома и бизнеса" : "Find the right products for home and business",
    startNow: isBg ? "Към каталога" : "Open catalog",
  };

  const steps = [
    { title: isBg ? "Избери продукти" : "Choose products", description: isBg ? "Търси по име, категория, марка, цена и рейтинг." : "Search by name, category, brand, price and rating.", icon: BuildingStorefrontIcon },
    { title: isBg ? "Добави в количката" : "Add to cart", description: isBg ? "Виж актуалната наличност и цената на продукта." : "See current stock and product pricing.", icon: CheckBadgeIcon },
    { title: isBg ? "Завърши поръчката" : "Place the order", description: isBg ? "Въведи данните за доставка и потвърди поръчката." : "Enter delivery details and confirm the order.", icon: CreditCardIcon },
  ];

  return (
    <div className="bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div className="relative">
        <HomeHeroSlider />

        <div className="absolute inset-x-0 bottom-3 z-30">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 sm:flex-wrap sm:justify-center sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { key: "best" as const, label: text.best },
              { key: "popular" as const, label: text.popular },
              { key: "rating" as const, label: text.rating },
            ].map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveProductTab(tab.key)} className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide shadow-sm transition sm:px-6 ${activeProductTab === tab.key ? "bg-orange-500 text-white" : "bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-black"}`}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:px-6 lg:px-8 dark:text-slate-200">
          <span className="font-semibold">{isBg ? "Минимална стойност на поръчката: 50 €." : "Minimum order value: €50."}</span>
          <span>
            {isBg ? "За цени на едро, моля използвайте " : "For wholesale pricing, please use the "}
            <Link to="/contact" className="font-semibold text-[#18b99f] underline underline-offset-2">
              {isBg ? "контактната форма" : "contact form"}
            </Link>
            {isBg ? " или се обадете на " : " or call "}
            <a href={`tel:${CONTACT_PHONE_LINK}`} className="font-semibold text-[#18b99f] underline underline-offset-2">{CONTACT_PHONE_DISPLAY}</a>.
          </span>
        </div>
      </section>

      {tabProducts.length > 0 && (
        <section className="site-container py-7 sm:py-8">
          <div className="product-card-grid">
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
        <section className="site-container py-8 sm:py-10">
          <div className="text-center"><h2 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">{text.latest}</h2></div>
          <div className="mt-6 product-card-grid sm:mt-8">{latestProducts.slice(0, 10).map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      <section className="relative overflow-hidden bg-slate-900 py-10 text-white sm:py-14">
        <div className="absolute inset-0 bg-cover opacity-30" style={{ backgroundImage: "url(/images/home-needs-bg.jpg)", backgroundPosition: "center top" }} />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative mx-auto max-w-7xl px-3 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">{isBg ? "Избери според нуждите си" : "Choose by your needs"}</h2>
          <div className="mx-auto mt-7 grid max-w-5xl gap-4 sm:mt-10 md:grid-cols-3 md:gap-6">
            {[
              {
                title: isBg ? "За дома" : "For home",
                description: isBg ? "Продукти за ежедневна грижа и почистване." : "Products for everyday care and cleaning.",
                icon: HomeIcon,
                to: "/products",
              },
              {
                title: isBg ? "За бизнеса" : "For business",
                description: isBg ? "Решения за офиси, обекти и професионална употреба." : "Solutions for offices, facilities and professional use.",
                icon: BriefcaseIcon,
                to: "/products",
              },
              {
                title: isBg ? "Нужна помощ?" : "Need help?",
                description: isBg ? "Свържи се с нас и ще помогнем с избора." : "Contact us and we will help you choose.",
                icon: ChatBubbleLeftRightIcon,
                to: "/contact",
              },
            ].map((item, index) => (
              <Link key={item.title} to={item.to} className={`rounded-2xl bg-white/95 p-5 text-slate-950 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl sm:p-7 ${index === 1 ? "md:-translate-y-2 md:hover:-translate-y-3" : ""}`}>
                <item.icon className="mx-auto h-9 w-9 text-orange-500" />
                <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
              </Link>
            ))}
          </div>
          <Link to="/products" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-sm font-bold uppercase text-white hover:bg-orange-600 sm:mt-9">
            {isBg ? "Към каталога" : "Open catalog"}
          </Link>
        </div>
      </section>

      {discountedProducts.length > 0 && (
        <section className="site-container py-8 sm:py-10">
          <div className="text-center"><h2 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">{text.promotions}</h2></div>
          <div className="mt-6 product-card-grid">{discountedProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      <section className="site-container py-6 sm:py-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-cover opacity-30" style={{ backgroundImage: "url(/images/home-shopping-bg.jpg)", backgroundPosition: "center top" }} />
          <div className="absolute inset-0 bg-slate-950/60" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-400">
                {isBg ? "SANO решения" : "SANO solutions"}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                {isBg ? "Професионална грижа за дома и бизнеса" : "Professional care for home and business"}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                {isBg ? "Разгледай подбрани почистващи и перилни продукти за ежедневна и професионална употреба." : "Explore selected cleaning and laundry products for everyday and professional use."}
              </p>
            </div>
            <Link to="/products" className="inline-flex min-h-12 shrink-0 items-center justify-center self-start rounded-full bg-orange-500 px-7 py-3 text-sm font-bold uppercase text-white transition hover:bg-orange-600 md:self-auto">
              {isBg ? "Разгледай продуктите" : "Browse products"}
            </Link>
          </div>
        </div>
      </section>

      {mainCategories.length > 0 && (
        <section className="site-container py-8 sm:py-10">
          <div className="text-center"><h2 className="font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">{text.categories}</h2></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {mainCategories.slice(0, 10).map((category) => {
              const image = category.imageUri ?? category.imageURI ?? "";
              return (
                <Link key={category.id} to={categorySeoPath(category)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-black">
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
            [isBg ? "Коректно обслужване" : "Reliable service", CheckBadgeIcon],
            [isBg ? "Качествени продукти" : "Quality products", BuildingStorefrontIcon],
            [isBg ? "SANO за дома и бизнеса" : "SANO for home and business", ShieldCheckIcon],
            [isBg ? "Актуални цени и наличности" : "Current prices and stock", CreditCardIcon],
          ].map(([title, Icon]) => {
            const ItemIcon = Icon as typeof CheckBadgeIcon;
            return <div key={String(title)}><ItemIcon className="mx-auto h-11 w-11 text-slate-600 dark:text-white sm:h-12 sm:w-12" /><h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white sm:text-xl">{String(title)}</h3></div>;
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;