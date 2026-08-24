import { BuildingStorefrontIcon, CubeIcon, TruckIcon } from "@heroicons/react/24/outline";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { CONTACT_AREA_BG, CONTACT_AREA_EN } from "../config/contact";

const About = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const features = [
    {
      icon: BuildingStorefrontIcon,
      title: isBg ? "Професионална хигиена" : "Professional hygiene",
      description: isBg
        ? "Препарати за дома, бизнеса, пране, подови настилки, санитарни помещения, кухня и специализирано почистване."
        : "Cleaning products for homes, businesses, laundry, floors, sanitary areas, kitchens and specialized cleaning.",
    },
    {
      icon: CubeIcon,
      title: isBg ? "Реални наличности" : "Real stock levels",
      description: isBg
        ? "Каталогът, наличностите, цените и промоциите се управляват от една система, за да виждаш актуална информация."
        : "Catalog, stock, prices and promotions are managed from one system so the information stays current.",
    },
    {
      icon: TruckIcon,
      title: isBg ? "Обслужване на региона" : "Regional service",
      description: isBg ? CONTACT_AREA_BG : CONTACT_AREA_EN,
    },
  ];

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f766e_0%,#0f4c5c_55%,#0f172a_100%)]">
        <div className="mx-auto max-w-6xl px-3 py-12 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-100 sm:text-sm sm:tracking-[0.32em]">{isBg ? "За HygiaTrade" : "About HygiaTrade"}</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-3xl font-bold tracking-tight text-white sm:mt-5 sm:text-5xl">
            {isBg ? "Продукти за чистота и хигиена за дома и бизнеса" : "Cleaning and hygiene products for homes and businesses"}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-teal-50 sm:mt-6 sm:text-lg sm:leading-8">
            {isBg
              ? "HygiaTrade предлага почистващи препарати, консумативи и решения за ежедневна и професионална хигиена с ясна информация за цена и наличност."
              : "HygiaTrade offers cleaning products, consumables and solutions for everyday and professional hygiene with clear pricing and stock information."}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-3 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div className="space-y-5 sm:space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-600 sm:tracking-[0.24em]">{isBg ? "Нашият каталог" : "Our catalog"}</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{isBg ? "Подбрани продукти за различни нужди от почистване" : "Products selected for different cleaning needs"}</h2>
          <p className="text-base leading-7 text-slate-600">
            {isBg
              ? "Категориите включват перилни препарати, общо и професионално почистване, препарати за баня, кухня, мебели, прозорци, подове, ароматизатори, хартия и други консумативи."
              : "Categories include laundry detergents, general and professional cleaning, bathroom and kitchen cleaners, furniture and window care, floor products, air fresheners, paper goods and other consumables."}
          </p>
          <p className="text-base leading-7 text-slate-600">
            {isBg
              ? "Сайтът е свързан с управлението на продуктите, наличностите и поръчките, така че клиентският каталог и административната част използват едни и същи данни."
              : "The storefront is connected to product, inventory and order management so the customer catalog and administration use the same data."}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-4">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
            alt={isBg ? "Професионално почистване" : "Professional cleaning"}
            className="h-full min-h-[240px] w-full rounded-xl object-cover sm:min-h-[420px] sm:rounded-[1.5rem]"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-3 pb-12 sm:gap-6 sm:px-6 sm:pb-20 lg:grid-cols-3 lg:px-8">
        {features.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.5)] sm:rounded-[2rem] sm:p-7">
            <item.icon className="h-11 w-11 rounded-2xl bg-primary-50 p-2.5 text-primary-600" />
            <h3 className="mt-5 font-display text-xl font-semibold text-slate-950 sm:mt-6">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default About;
