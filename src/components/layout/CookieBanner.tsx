"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const CONSENT_KEY = "higiatrade_cookie_consent";

type Consent = "accepted" | "essential";

const CookieBanner = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(CONSENT_KEY));
  }, []);

  const save = (value: Consent) => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[250] border-t border-slate-200 bg-white/95 p-4 shadow-[0_-20px_60px_-30px_rgba(15,23,42,.45)] backdrop-blur dark:border-white/15 dark:bg-slate-950/95">
      <div className="site-container flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          <strong className="block text-base text-slate-950 dark:text-white">{isBg ? "Бисквитки" : "Cookies"}</strong>
          <span>{isBg ? "Използваме задължителни бисквитки за работата на магазина. Допълнителни бисквитки се използват само след съгласие." : "We use essential cookies for the store to function. Additional cookies are used only with your consent."}</span>{" "}
          <Link to="/cookies" className="font-semibold text-[#159b87] hover:underline">{isBg ? "Научи повече" : "Learn more"}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => save("essential")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{isBg ? "Само задължителни" : "Essential only"}</button>
          <button type="button" onClick={() => save("accepted")} className="rounded-xl bg-[#18b99f] px-4 py-2.5 text-sm font-semibold text-white">{isBg ? "Приемам всички" : "Accept all"}</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
