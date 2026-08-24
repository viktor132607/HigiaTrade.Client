import { Link } from "react-router-dom";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

const NotFound = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-3 py-10 sm:px-4">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-7xl font-bold text-primary-500 sm:text-9xl">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">{isBg ? "Страницата не е намерена" : "Page not found"}</h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">{isBg ? "Страницата, която търсиш, не съществува или е преместена." : "The page you're looking for doesn't exist or may have moved."}</p>
        <div className="mt-8">
          <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary-500 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-primary-600">{isBg ? "Към началната страница" : "Back to home"}</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
