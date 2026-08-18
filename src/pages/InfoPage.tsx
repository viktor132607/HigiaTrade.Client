import { Link } from "react-router-dom";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface InfoPageProps {
  titleBg: string;
  titleEn: string;
  descriptionBg: string;
  descriptionEn: string;
}

const InfoPage = ({ titleBg, titleEn, descriptionBg, descriptionEn }: InfoPageProps) => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white px-4 py-14 text-black transition-colors dark:bg-black dark:text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-[#d6dde3] bg-white p-8 shadow-sm dark:border-white/20 dark:bg-black">
        <h1 className="text-3xl font-bold tracking-tight">
          {isBg ? titleBg : titleEn}
        </h1>
        <p className="mt-4 text-base leading-7 text-[#4b5d6d] dark:text-white/75">
          {isBg ? descriptionBg : descriptionEn}
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex rounded-none bg-[#18b99f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#14a990]"
        >
          {isBg ? "Към продуктите" : "Go to products"}
        </Link>
      </section>
    </main>
  );
};

export default InfoPage;
