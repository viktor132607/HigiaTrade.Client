import { Link } from "react-router-dom";
import {
  CurrencyDollarIcon,
  LockClosedIcon,
  ShoppingBagIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import {
  CONTACT_ADDRESS_BG,
  CONTACT_ADDRESS_EN,
  CONTACT_AREA_BG,
  CONTACT_AREA_EN,
  CONTACT_EMAILS,
  CONTACT_PHONE_COMPACT,
} from "../../config/contact";

const Footer = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const benefits = [
    {
      icon: UserGroupIcon,
      titleBg: "Доволни клиенти",
      titleEn: "Happy customers",
      textBg: "Лесно пазаруване, коректна информация за продукти и бърза обратна връзка.",
      textEn: "Easy shopping, clear product information and quick support.",
    },
    {
      icon: ShoppingBagIcon,
      titleBg: "Премиум продукти",
      titleEn: "Premium products",
      textBg: "Подбрани почистващи и перилни препарати за дома, офиса и бизнеса.",
      textEn: "Selected cleaning and laundry products for home, office and business.",
    },
    {
      icon: LockClosedIcon,
      titleBg: "Сигурно пазаруване",
      titleEn: "Secure shopping",
      textBg: "Ясни поръчки, актуални наличности и надеждна обработка.",
      textEn: "Clear orders, current stock and reliable processing.",
    },
    {
      icon: CurrencyDollarIcon,
      titleBg: "Конкурентни цени",
      titleEn: "Competitive prices",
      textBg: "Добри цени за домакинства, магазини, офиси и бизнес клиенти.",
      textEn: "Good prices for households, shops, offices and business clients.",
    },
  ];

  return (
    <footer className="border-t border-[#d6dde3] bg-[#f4f6f8] text-[#263b4d] transition-colors dark:border-white/20 dark:bg-black dark:text-white">
      <div className="border-b border-[#d6dde3] bg-[#f7f8fa] dark:border-white/20 dark:bg-black">
        <div className="site-container grid gap-7 py-8 sm:gap-8 sm:py-10 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.titleBg} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center text-[#263b4d] dark:text-white">
                  <Icon className="h-12 w-12 stroke-[1.5]" />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#263b4d] dark:text-white sm:text-xl">
                  {isBg ? item.titleBg : item.titleEn}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#6f7f8c] dark:text-white/70">
                  {isBg ? item.textBg : item.textEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="site-container grid gap-8 py-8 text-sm sm:py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="text-lg font-bold text-[#263b4d] dark:text-white">
            {isBg ? "Пазарувай с Хигия" : "Shop with Hygia"}
          </h4>
          <div className="mt-4 grid gap-2 text-[#4b5d6d] dark:text-white/75">
            <Link to="/register" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Регистрирай се" : "Register"}
            </Link>
            <Link to="/products" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Продукти" : "Products"}
            </Link>
            <Link to="/orders" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Проследяване на поръчки" : "Order tracking"}
            </Link>
            <Link to="/about" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "За нас" : "About us"}
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#263b4d] dark:text-white">
            {isBg ? "Моят акаунт" : "My account"}
          </h4>
          <div className="mt-4 grid gap-2 text-[#4b5d6d] dark:text-white/75">
            <Link to="/login" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Влизане" : "Sign in"}
            </Link>
            <Link to="/profile" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Профил" : "Profile"}
            </Link>
            <Link to="/wishlist" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Любими" : "Wishlist"}
            </Link>
            <Link to="/cart" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Количка" : "Cart"}
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#263b4d] dark:text-white">
            {isBg ? "Информация" : "Information"}
          </h4>
          <div className="mt-4 grid gap-2 text-[#4b5d6d] dark:text-white/75">
            <Link to="/promotions" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Промоции" : "Promotions"}
            </Link>
            <Link to="/new-products" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Нови стоки" : "New products"}
            </Link>
            <Link to="/best-sellers" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "Най-продавани" : "Best sellers"}
            </Link>
            <Link to="/brands" className="min-h-11 py-2 hover:text-[#18b99f]">
              {isBg ? "По марка" : "By brand"}
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-[#263b4d] dark:text-white">
            {isBg ? "За контакти" : "Contacts"}
          </h4>
          <div className="mt-4 space-y-2 break-words text-[#4b5d6d] dark:text-white/75">
            <p>{isBg ? "Телефон" : "Phone"}: {CONTACT_PHONE_COMPACT}</p>
            {CONTACT_EMAILS.map((email) => (
              <p key={email}>
                Email:{" "}
                <a href={`mailto:${email}`} className="hover:text-[#18b99f]">
                  {email}
                </a>
              </p>
            ))}
            <p>
              {isBg ? "Адрес" : "Address"}: {isBg ? CONTACT_ADDRESS_BG : CONTACT_ADDRESS_EN}
            </p>
            <p>{isBg ? CONTACT_AREA_BG : CONTACT_AREA_EN}</p>
          </div>

          <h4 className="mt-7 text-lg font-bold text-[#263b4d] dark:text-white">
            {isBg ? "За магазин Хигия" : "About HygiaTrade"}
          </h4>
          <p className="mt-3 text-xs leading-5 text-[#4b5d6d] dark:text-white/75">
            {isBg
              ? "Онлайн магазин Хигия за почистващи препарати, перилни препарати и консумативи за дома, офиса и бизнеса."
              : "Hygia online store for cleaning products, laundry detergents and supplies for home, office and business."}
          </p>
        </div>
      </div>

      <div className="border-t border-[#d6dde3] bg-[#263b4d] text-white dark:border-white/20 dark:bg-black">
        <div className="site-container flex flex-col gap-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} HygiaTrade.{" "}
            {isBg ? "Всички права запазени." : "All rights reserved."}
          </p>
          <p>
            {isBg
              ? "Цените и наличностите се обновяват редовно."
              : "Prices and stock levels are updated regularly."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
