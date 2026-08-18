import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
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
    <div className="bg-white text-black transition-colors dark:bg-black dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[#d6dde3] bg-[#f7f8fa] p-8 text-center dark:border-white/20 dark:bg-black sm:p-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {isBg ? titleBg : titleEn}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#4b5d6d] dark:text-white/75">
            {isBg ? descriptionBg : descriptionEn}
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-none bg-[#18b99f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#14a990]"
          >
            {isBg ? "Към продуктите" : "Go to products"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default InfoPage;
