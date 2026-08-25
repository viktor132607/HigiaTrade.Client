import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPinIcon, ShieldCheckIcon, TruckIcon } from "@heroicons/react/24/outline";
import ProductCard from "../components/products/ProductCard";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

const SERVICE_AREAS_BG = ["Русе", "Силистра", "Разград", "Свищов", "Бяла", "Търговище"];
const SERVICE_AREAS_EN = ["Ruse", "Silistra", "Razgrad", "Svishtov", "Byala", "Targovishte"];
const SANO_DISTRIBUTOR_SOURCE = "https://sanobg.com/buy/";

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

const SanoDistributor = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const areas = isBg ? SERVICE_AREAS_BG : SERVICE_AREAS_EN;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          Brand: "SANO",
          PageNumber: "1",
          PageSize: "12",
          SortBy: "title",
          SortDescending: "false",
        });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`);
        if (!response.ok) return;
        const data = await response.json();
        setProducts(Array.isArray(data.items) ? data.items : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d5260_58%,#18b99f_135%)] text-white">
        <div className="site-container py-12 sm:py-16 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8be4d5]">SANO · HygiaTrade</p>
          <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {isBg
              ? "Дистрибутор на SANO за Русе, Силистра, Разград, Свищов, Бяла и Търговище"
              : "SANO distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte"}
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-7 text-white/85 sm:text-lg">
            {isBg
              ? "Хигия Трейд ООД доставя перилни и почистващи препарати SANO за дома, магазини, офиси и бизнес клиенти в обслужвания район. За количества, наличности и търговски условия изпратете запитване директно към нас."
              : "Hygia Trade Ltd. supplies SANO laundry and cleaning products for households, shops, offices and business customers throughout the service area. Contact us for stock, quantities and commercial terms."}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/contact" className="inline-flex min-h-12 items-center justify-center bg-[#18b99f] px-6 py-3 text-sm font-bold text-white hover:bg-[#14a990]">
              {isBg ? "Запитване за SANO" : "Enquire about SANO"}
            </Link>
            <Link to="/brands" className="inline-flex min-h-12 items-center justify-center border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
              {isBg ? "Всички марки" : "All brands"}
            </Link>
          </div>
        </div>
      </section>

      <section className="site-container py-10 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <MapPinIcon className="h-9 w-9 text-[#18b99f]" />
            <h2 className="mt-4 text-xl font-bold">{isBg ? "Район на дистрибуция" : "Distribution area"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isBg ? "Обслужваме директно района на:" : "We directly serve:"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map((area) => (
                <span key={area} className="rounded-full bg-[#18b99f]/10 px-3 py-1.5 text-sm font-semibold text-[#148f7c]">{area}</span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <TruckIcon className="h-9 w-9 text-[#18b99f]" />
            <h2 className="mt-4 text-xl font-bold">{isBg ? "Перилни и почистващи препарати" : "Laundry and cleaning products"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isBg
                ? "Заявки за SANO продукти за пране, кухня, баня, подове, повърхности и ежедневна хигиена за дома и бизнеса."
                : "Orders for SANO laundry, kitchen, bathroom, floor, surface and everyday hygiene products for home and business use."}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheckIcon className="h-9 w-9 text-[#18b99f]" />
            <h2 className="mt-4 text-xl font-bold">{isBg ? "Потвърден дистрибутор" : "Verified distributor listing"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isBg
                ? "Хигия Трейд ООД е публикувана от SANO България като дистрибутор за този район."
                : "Hygia Trade Ltd. is listed by SANO Bulgaria as the distributor for this area."}
            </p>
            <a href={SANO_DISTRIBUTOR_SOURCE} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-bold text-[#148f7c] hover:underline">
              {isBg ? "Провери в SANO България" : "Verify on SANO Bulgaria"}
            </a>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="site-container py-10 sm:py-14">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18b99f]">{isBg ? "SANO продукти" : "SANO products"}</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">{isBg ? "Продукти SANO в каталога" : "SANO products in the catalogue"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isBg
                ? "Наличностите се обновяват от каталога. Ако конкретен SANO продукт не е показан, свържете се с нас за заявка или срок за доставка."
                : "Availability is loaded from the catalogue. If a specific SANO product is not shown, contact us for ordering or lead time."}
            </p>
          </div>

          {loading ? (
            <div className="mt-8 text-sm text-slate-500">{isBg ? "Зареждане..." : "Loading..."}</div>
          ) : products.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              {isBg
                ? "В момента няма активни SANO артикули, показани в каталога. Изпратете запитване и ще проверим наличност или доставка."
                : "There are currently no active SANO items displayed in the catalogue. Send an enquiry and we will check stock or supply."}
            </div>
          )}
        </div>
      </section>

      <section className="site-container py-10 sm:py-14">
        <h2 className="text-2xl font-black sm:text-3xl">{isBg ? "Често задавани въпроси" : "Frequently asked questions"}</h2>
        <div className="mt-6 grid gap-3">
          <details className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold">{isBg ? "Кой е дистрибуторът на SANO за Русе?" : "Who is the SANO distributor for Ruse?"}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isBg
                ? "Хигия Трейд ООД е посочена от SANO България като дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище."
                : "SANO Bulgaria lists Hygia Trade Ltd. as distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte."}
            </p>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold">{isBg ? "Мога ли да поръчам SANO за фирма или магазин?" : "Can I order SANO for a company or shop?"}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isBg
                ? "Да. Свържете се с Хигия Трейд за количества, наличности, бизнес доставки и търговски условия според вашата заявка."
                : "Yes. Contact Hygia Trade for quantities, availability, business deliveries and commercial terms for your order."}
            </p>
          </details>
          <details className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold">{isBg ? "За кои градове е районът на дистрибуция?" : "Which cities are in the distribution area?"}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">{areas.join(", ")}.</p>
          </details>
        </div>
      </section>
    </main>
  );
};

export default SanoDistributor;
