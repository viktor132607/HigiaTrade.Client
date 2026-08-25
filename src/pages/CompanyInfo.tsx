import { Link } from "react-router-dom";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

const regions = [
  ["ruse", "Русе", "Ruse"],
  ["silistra", "Силистра", "Silistra"],
  ["razgrad", "Разград", "Razgrad"],
  ["svishtov", "Свищов", "Svishtov"],
  ["byala", "Бяла", "Byala"],
  ["targovishte", "Търговище", "Targovishte"],
] as const;

const CompanyInfo = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 sm:py-12">
      <div className="site-container max-w-5xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#148f7c]">
            {isBg ? "Фирмена информация" : "Company information"}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {isBg ? "Хигия Трейд ООД" : "Hygia Trade Ltd."}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {isBg
              ? "HygiaTrade е онлайн каталогът на Хигия Трейд ООД. Фирмата е базирана в Русе и предлага перилни и почистващи препарати, хигиенни консумативи и професионални решения за дома и бизнеса."
              : "HygiaTrade is the online catalogue of Hygia Trade Ltd., based in Ruse, Bulgaria, offering laundry and cleaning products, hygiene supplies and professional solutions for households and businesses."}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{isBg ? "Адрес" : "Address"}</dt>
              <dd className="mt-2 font-semibold text-slate-900">гр. Русе, ул. Акад. Михаил Арнаудов №3</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{isBg ? "Контакти" : "Contacts"}</dt>
              <dd className="mt-2 font-semibold text-slate-900">0888 822 861 · higiatrade@abv.bg</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">SANO</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            {isBg
              ? "SANO България публикува Хигия Трейд ООД като дистрибутор за Русе, Силистра, Разград, Свищов, Бяла и Търговище."
              : "SANO Bulgaria lists Hygia Trade Ltd. as distributor for Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/sano" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">
              {isBg ? "SANO в HygiaTrade" : "SANO at HygiaTrade"}
            </Link>
            <a href="https://sanobg.com/buy/" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">
              {isBg ? "Официален списък на SANO България" : "Official SANO Bulgaria distributor list"}
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-slate-950">{isBg ? "Район на дистрибуция" : "Distribution area"}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map(([slug, bg, en]) => (
              <Link key={slug} to={`/sano/${slug}`} className="rounded-2xl border border-slate-200 p-4 font-bold text-slate-900 transition hover:border-[#18b99f] hover:text-[#148f7c]">
                SANO · {isBg ? bg : en}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default CompanyInfo;