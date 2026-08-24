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
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { formatCurrency } from "../utils/currency";

interface Category {
  id: string;
  name: string;
  imageURI?: string;
  imageUri?: string;
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

const fallbackCategories: Category[] = Array.from({ length: 10 }, (_, index) => ({
  id: `placeholder-${index + 1}`,
  name: `Категория ${index + 1}`,
  imageUri: [
    "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=900&q=80",
  ][index % 4],
}));

const HomeProductTile = ({ product, language }: { product: Product; language: "bg" | "en" }) => {
  const displayPrice =
    product.discountedPrice && product.discountedPrice > 0
      ? product.discountedPrice
      : product.regularPrice;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-black dark:text-white"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={product.mainImageUrl || "/placeholder-image.jpg"}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {product.discountPercentage ? (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{product.discountPercentage}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-950 dark:text-white">
          {product.title}
        </h3>
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
          {product.quantity > 0
            ? language === "bg"
              ? "В наличност"
              : "In stock"
            : language === "bg"
              ? "Изчерпан"
              : "Out of stock"}
        </p>
        <div className="mt-3 flex items-end gap-2">
          <p className="text-base font-black text-slate-950 dark:text-white">
            {formatCurrency(displayPrice)}
          </p>
          {product.discountedPrice && product.discountedPrice > 0 ? (
            <p className="text-xs text-slate-400 line-through">
              {formatCurrency(product.regularPrice)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="mt-3 rounded bg-orange-500 px-3 py-2 text-xs font-bold uppercase text-white transition hover:bg-orange-600"
        >
          {language === "bg" ? "В количката" : "Add to cart"}
        </button>
      </div>
    </Link>
  );
};

const Home = () => {
  const { language } = useLanguageTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [activeProductTab, setActiveProductTab] = useState<"best" | "popular" | "rating">("best");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [categoriesResponse, bestSellersResponse, latestProductsResponse] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/best-sellers?numOfBestSellers=6`),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=8&SortBy=createdOn&SortDescending=true`),
          ]);

        if (categoriesResponse.ok) {
          const categoriesData = (await categoriesResponse.json()) as Category[];
          setCategories(categoriesData);
        }

        if (bestSellersResponse.ok) {
          const bestSellersData = (await bestSellersResponse.json()) as Product[];
          setBestSellers(bestSellersData);
        }

        if (latestProductsResponse.ok) {
          const latestProductsData = await latestProductsResponse.json();
          setLatestProducts(
            Array.isArray(latestProductsData)
              ? latestProductsData
              : latestProductsData.items ?? []
          );
        }
      } catch (error) {
        console.error("Home data fetch failed:", error);
      }
    };

    void fetchHomeData();
  }, []);

  const visibleCategories = categories.length > 0 ? categories : fallbackCategories;
  const visibleBestSellers = bestSellers;
  const visibleLatestProducts = latestProducts;

  const tabProducts = useMemo(() => {
    if (activeProductTab === "rating") {
      return [...visibleBestSellers].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    if (activeProductTab === "popular") {
      return visibleLatestProducts;
    }

    return visibleBestSellers;
  }, [activeProductTab, visibleBestSellers, visibleLatestProducts]);

  const text = {
    startShopping:
      language === "bg"
        ? "Започнете да пазарувате в нашия магазин любимите си продукти!"
        : "Start shopping in our store for your favorite products!",
    register: language === "bg" ? "Регистрирайте се" : "Register",
    registerText:
      language === "bg"
        ? "Регистрацията е безплатна и отнема секунди."
        : "Registration is free and takes seconds.",
    details: language === "bg" ? "Въведете Вашите данни" : "Enter your details",
    detailsText:
      language === "bg"
        ? "Попълнете адрес и информация за доставка."
        : "Add your address and delivery information.",
    secure: language === "bg" ? "Пазарувайте сигурно" : "Shop securely",
    secureText:
      language === "bg"
        ? "Вашата поръчка се обработва надеждно."
        : "Your order is processed safely.",
    startNow: language === "bg" ? "Започни сега" : "Start now",
    latest: language === "bg" ? "Последно добавени артикули" : "Latest added products",
    latestText:
      language === "bg"
        ? "Разгледайте новите продукти, промоциите и наличните артикули."
        : "Browse new products, promotions and available items.",
    best: language === "bg" ? "Най-продавани" : "Best sellers",
    popular: language === "bg" ? "Най-популярни" : "Most popular",
    rating: language === "bg" ? "Най-висок рейтинг" : "Highest rating",
    viewAll: language === "bg" ? "Виж всички продукти" : "View all products",
    promoTitle: language === "bg" ? "Седмични предложения" : "Weekly offers",
    delivery: language === "bg" ? "Поръчка по телефон" : "Phone orders",
    deliveryText: language === "bg" ? "Бърза връзка за наличности и заявки." : "Fast contact for stock and orders.",
    freeDelivery: language === "bg" ? "Доставка" : "Delivery",
    freeDeliveryText: language === "bg" ? "Удобна доставка според наличностите." : "Convenient delivery based on stock.",
    productReturn: language === "bg" ? "Връщане на продукт" : "Product returns",
    productReturnText: language === "bg" ? "Ясни условия за замяна и връщане." : "Clear exchange and return terms.",
    warranty: language === "bg" ? "Гаранция" : "Guarantee",
    warrantyText: language === "bg" ? "Поддръжка при въпроси за продукти." : "Support for product questions.",
    clients: language === "bg" ? "Доволни клиенти" : "Happy clients",
    clientsText: language === "bg" ? "Коректно обслужване и ясна информация." : "Reliable service and clear information.",
    premium: language === "bg" ? "Качествени продукти" : "Quality products",
    premiumText: language === "bg" ? "Подбрани препарати за ежедневна употреба." : "Selected products for everyday use.",
    safe: language === "bg" ? "Сигурно пазаруване" : "Secure shopping",
    safeText: language === "bg" ? "Поръчките се обработват внимателно." : "Orders are handled carefully.",
    prices: language === "bg" ? "Конкурентни цени" : "Competitive prices",
    pricesText: language === "bg" ? "Актуални цени и наличности." : "Current prices and stock levels.",
  };

  const steps = [
    { title: text.register, description: text.registerText, icon: BuildingStorefrontIcon },
    { title: text.details, description: text.detailsText, icon: CreditCardIcon },
    { title: text.secure, description: text.secureText, icon: ShieldCheckIcon },
  ];

  const serviceItems = [
    { title: text.delivery, description: text.deliveryText, icon: TruckIcon, color: "bg-emerald-500" },
    { title: text.freeDelivery, description: text.freeDeliveryText, icon: ArrowRightIcon, color: "bg-rose-500" },
    { title: text.productReturn, description: text.productReturnText, icon: CheckBadgeIcon, color: "bg-yellow-400" },
    { title: text.warranty, description: text.warrantyText, icon: ShieldCheckIcon, color: "bg-sky-500" },
  ];

  const trustItems = [
    { title: text.clients, description: text.clientsText, icon: CheckBadgeIcon },
    { title: text.premium, description: text.premiumText, icon: BuildingStorefrontIcon },
    { title: text.safe, description: text.safeText, icon: ShieldCheckIcon },
    { title: text.prices, description: text.pricesText, icon: CreditCardIcon },
  ];

  const promos = [
    {
      title: language === "bg" ? "Black Friday оферти" : "Black Friday offers",
      subtitle: language === "bg" ? "До -20% на подбрани артикули" : "Up to -20% on selected items",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: language === "bg" ? "Професионални препарати" : "Professional detergents",
      subtitle: language === "bg" ? "За бизнес и офис клиенти" : "For business and office clients",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: language === "bg" ? "Чистота у дома" : "Clean home",
      subtitle: language === "bg" ? "Ежедневни продукти на склад" : "Everyday products in stock",
      image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="bg-white text-slate-950 transition-colors dark:bg-black dark:text-white">
      <HomeHeroSlider />

      <section className="border-b border-slate-200 bg-slate-50 py-3 transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
          {[
            { key: "best" as const, label: text.best },
            { key: "popular" as const, label: text.popular },
            { key: "rating" as const, label: text.rating },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveProductTab(tab.key)}
              className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wide transition ${
                activeProductTab === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-black dark:hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {tabProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-6">
            {tabProducts.slice(0, 6).map((product) => (
              <HomeProductTile key={product.id} product={product} language={language} />
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-slate-900 py-14 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=1600&q=80)" }} />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {text.startShopping}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
            {steps.map((step) => (
              <div key={step.title} className="contents">
                <div className="rounded-full bg-white/90 p-8 text-slate-950 shadow-xl backdrop-blur dark:bg-slate-950/90 dark:text-white">
                  <step.icon className="mx-auto h-9 w-9 text-orange-500" />
                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
                <ArrowRightIcon className="mx-auto hidden h-8 w-8 text-white/80 md:block" />
              </div>
            ))}
            <Link
              to="/products"
              className="flex min-h-40 items-center justify-center rounded-full bg-white/90 px-8 text-sm font-bold uppercase text-orange-500 shadow-xl transition hover:bg-orange-500 hover:text-white dark:bg-slate-950/90"
            >
              {text.startNow}
            </Link>
          </div>
        </div>
      </section>

      {visibleLatestProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              {text.latest}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-300">
              {text.latestText}
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {visibleLatestProducts.slice(0, 8).map((product) => (
              <HomeProductTile key={product.id} product={product} language={language} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-slate-50 transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
          {serviceItems.map((item) => (
            <div key={item.title} className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${item.color} text-white`}>
                <item.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-bold uppercase text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-5 font-display text-2xl font-bold text-slate-950 dark:text-white">
          {text.promoTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {promos.map((promo) => (
            <Link
              key={promo.title}
              to="/products"
              className="group relative min-h-56 overflow-hidden rounded-sm bg-slate-900 text-white shadow"
            >
              <img
                src={promo.image}
                alt={promo.title}
                className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <h3 className="font-display text-2xl font-bold uppercase">{promo.title}</h3>
                <p className="mt-2 text-sm text-white/85">{promo.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {trustItems.map((item) => (
            <div key={item.title} className="text-center">
              <item.icon className="mx-auto h-12 w-12 text-slate-600 dark:text-white" />
              <h3 className="mt-4 font-display text-xl font-bold text-slate-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {language === "bg" ? "Категории" : "Categories"}
          </h2>
          <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300">
            {text.viewAll}
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visibleCategories.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${encodeURIComponent(category.id)}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-black"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={category.imageUri ?? category.imageURI ?? fallbackCategories[0].imageUri}
                  alt={category.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="font-bold text-slate-950 dark:text-white">{category.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {language === "bg" ? "Виж продукти" : "View products"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;