import { Link } from "react-router-dom";
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

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-900 text-white">
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url(/images/footer-bg.jpg)" }} />
      <div className="absolute inset-0 bg-slate-950/65" />
      <div className="relative site-container grid gap-8 py-8 text-sm sm:py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="text-lg font-bold">{isBg ? "Пазарувай с Хигия" : "Shop with Higia"}</h4>
          <div className="mt-3 grid gap-1 text-white/70">
            <Link to="/register" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Регистрирай се" : "Register"}</Link>
            <Link to="/products" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Продукти" : "Products"}</Link>
            <Link to="/orders" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Проследяване на поръчки" : "Order tracking"}</Link>
            <Link to="/about" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "За нас" : "About us"}</Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold">{isBg ? "Моят акаунт" : "My account"}</h4>
          <div className="mt-3 grid gap-1 text-white/70">
            <Link to="/login" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Влизане" : "Sign in"}</Link>
            <Link to="/profile" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Профил" : "Profile"}</Link>
            <Link to="/wishlist" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Любими" : "Wishlist"}</Link>
            <Link to="/cart" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Количка" : "Cart"}</Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold">{isBg ? "Информация" : "Information"}</h4>
          <div className="mt-3 grid gap-1 text-white/70">
            <Link to="/promotions" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Промоции" : "Promotions"}</Link>
            <Link to="/new-products" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Нови стоки" : "New products"}</Link>
            <Link to="/best-sellers" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Най-продавани" : "Best sellers"}</Link>
            <Link to="/brands" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "По марка" : "By brand"}</Link>
            <Link to="/privacy" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Поверителност" : "Privacy"}</Link>
            <Link to="/security" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Сигурност" : "Security"}</Link>
            <Link to="/cookies" className="min-h-8 py-1 hover:text-orange-400">{isBg ? "Бисквитки" : "Cookies"}</Link>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold">{isBg ? "За контакти" : "Contacts"}</h4>
          <div className="mt-3 space-y-1.5 break-words text-white/70">
            <p>{isBg ? "Телефон" : "Phone"}: {CONTACT_PHONE_COMPACT}</p>
            {CONTACT_EMAILS.map((email) => <p key={email}>Email: <a href={`mailto:${email}`} className="hover:text-orange-400">{email}</a></p>)}
            <p>{isBg ? "Адрес" : "Address"}: {isBg ? CONTACT_ADDRESS_BG : CONTACT_ADDRESS_EN}</p>
            <p>{isBg ? CONTACT_AREA_BG : CONTACT_AREA_EN}</p>
          </div>
          <h4 className="mt-7 text-lg font-bold">{isBg ? "За магазин Хигия" : "About HigiaTrade"}</h4>
          <p className="mt-3 text-xs leading-5 text-white/70">{isBg ? "Онлайн магазин Хигия за почистващи препарати, перилни препарати и консумативи за дома, офиса и бизнеса." : "Higia online store for cleaning products, laundry detergents and supplies for home, office and business."}</p>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-slate-950/90 text-white">
        <div className="site-container flex flex-col gap-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} HigiaTrade. {isBg ? "Всички права запазени." : "All rights reserved."}</p>
          <a href="https://viktor-iliev.site/portfolio/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400">
            {isBg ? "Сайтът е разработен от Viktor Iliev" : "Website developed by Viktor Iliev"}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
