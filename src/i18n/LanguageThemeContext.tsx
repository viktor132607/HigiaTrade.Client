"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type Language = "bg" | "en";
export type ThemeMode = "light" | "dark";
export type TranslationKey = string;

type TextPair = { bg: string; en: string };

const pairs: TextPair[] = [
  { bg: "Начало", en: "Home" },
  { bg: "Магазин", en: "Shop" },
  { bg: "Продукти", en: "Products" },
  { bg: "За нас", en: "About" },
  { bg: "За нас", en: "About us" },
  { bg: "Категории", en: "Categories" },
  { bg: "Промоции", en: "Promotions" },
  { bg: "Акция", en: "Sale" },
  { bg: "Нови стоки", en: "New products" },
  { bg: "Ново", en: "New" },
  { bg: "Най-продавани", en: "Best sellers" },
  { bg: "ТОП", en: "TOP" },
  { bg: "По марка", en: "By brand" },
  { bg: "Сравни", en: "Compare" },
  { bg: "Любими", en: "Wishlist" },
  { bg: "Количка", en: "Cart" },
  { bg: "Профил", en: "Account" },
  { bg: "Вход", en: "Sign in" },
  { bg: "Изход", en: "Sign out" },
  { bg: "Регистрация", en: "Create account" },
  { bg: "Админ", en: "Admin" },
  { bg: "Отвори админ панел", en: "Open admin panel" },
  { bg: "Търси по продукт или категория", en: "Search by product name or category" },
  { bg: "Търси продукти", en: "Search products" },
  { bg: "Препарати за дома, офиса и бизнеса", en: "Cleaning products for home, office and business" },
  { bg: "Свържете се с нас", en: "Contact us" },
  { bg: "Светла", en: "Light" },
  { bg: "Тъмна", en: "Dark" },
  { bg: "Почистващи и перилни препарати за дома, офиса и бизнеса", en: "Cleaning and laundry products for home, office and business" },
  { bg: "Качествени почистващи препарати, перилни препарати и консумативи за дома, офиса и бизнеса, с ясна информация за продукти, наличности и цени.", en: "Quality cleaning products, laundry detergents and supplies for homes, offices and business clients, with clear product, stock and price information." },
  { bg: "Обслужване", en: "Customer care" },
  { bg: "Проследяване на поръчки", en: "Order tracking" },
  { bg: "Доставка на почистващи и перилни препарати според наличностите.", en: "Delivery of cleaning and laundry products based on current stock." },
  { bg: "Подходящи продукти за домакинства, офиси, магазини и бизнес клиенти.", en: "Suitable products for households, offices, shops and business clients." },
  { bg: "Поддръжка за въпроси относно продукти, поръчки и наличности.", en: "Support for product, order and availability questions." },
  { bg: "Всички права запазени.", en: "All rights reserved." },
  { bg: "Цените и наличностите се обновяват редовно.", en: "Prices and stock levels are updated regularly." },
  { bg: "Екипировка, която издържа на тренировка и мач", en: "Equipment that holds up in training and on match day" },
  { bg: "Практичен спортен магазин за редовни тренировки, не само за разглеждане", en: "A practical sports store built for regular training, not just browsing" },
  { bg: "Оборудване за всекидневни спортисти и местни отбори", en: "Focused on everyday athletes and local teams" },
  { bg: "Нови сезонни предложения", en: "New season essentials" },
  { bg: "Популярни в момента", en: "Popular right now" },
  { bg: "Разгледай каталога", en: "Browse the catalog" },
  { bg: "Разгледай продукти", en: "Browse products" },
  { bg: "Отвори каталога", en: "Open catalog" },
  { bg: "Виж всички продукти", en: "View all products" },
  { bg: "Виж детайли", en: "View details" },
  { bg: "Филтри", en: "Filters" },
  { bg: "Приложи филтри", en: "Apply filters" },
  { bg: "Изчисти филтрите", en: "Clear filters" },
  { bg: "Цена", en: "Price" },
  { bg: "Ценови диапазон", en: "Price range" },
  { bg: "Мин", en: "Min" },
  { bg: "Макс", en: "Max" },
  { bg: "Рейтинг", en: "Rating" },
  { bg: "Най-нови", en: "Newest" },
  { bg: "Първо най-нови", en: "Newest first" },
  { bg: "Първо най-стари", en: "Oldest first" },
  { bg: "Възходящо", en: "Ascending" },
  { bg: "Низходящо", en: "Descending" },
  { bg: "Сортирай по:", en: "Sort by:" },
  { bg: "На страница:", en: "Per page:" },
  { bg: "Няма продукти за показване.", en: "No products to show." },
  { bg: "Няма продукти, които отговарят на филтрите.", en: "No products match the current filters." },
  { bg: "Зареждане...", en: "Loading..." },
  { bg: "Назад", en: "Back" },
  { bg: "Назад към начало", en: "Back to home" },
  { bg: "Страницата не е намерена", en: "Page not found" },
  { bg: "Страницата, която търсите, не съществува или е преместена.", en: "The page you&apos;re looking for doesn&apos;t exist or may have moved." },
  { bg: "Наличност:", en: "Availability:" },
  { bg: "В наличност", en: "In stock" },
  { bg: "Изчерпан", en: "Out of stock" },
  { bg: "Налични бройки:", en: "Units available:" },
  { bg: "Количество:", en: "Quantity:" },
  { bg: "Добави в количката", en: "Add to cart" },
  { bg: "Добави в любими", en: "Add to wishlist" },
  { bg: "Премахни от любими", en: "Remove from wishlist" },
  { bg: "Добавено в количката.", en: "Product added to cart." },
  { bg: "Добавено в любими.", en: "Added to wishlist." },
  { bg: "Премахнато от любими.", en: "Removed from wishlist." },
  { bg: "Влезте, за да добавите този продукт в количката.", en: "Sign in to add this product to your cart." },
  { bg: "Не можахме да добавим този продукт в количката.", en: "We could not add this product to your cart." },
  { bg: "Потребителски отзиви", en: "Customer reviews" },
  { bg: "Напиши отзив", en: "Write a review" },
  { bg: "Коментар", en: "Comment" },
  { bg: "Избери рейтинг", en: "Choose a rating" },
  { bg: "Публикувай отзив", en: "Publish review" },
  { bg: "Всички отзиви", en: "All reviews" },
  { bg: "Няма отзиви за този продукт все още.", en: "There are no reviews for this product yet." },
  { bg: "Бъдете първият клиент, който оставя мнение.", en: "Be the first customer to share feedback." },
  { bg: "Благодарим за отзива.", en: "Thanks for sharing your review." },
  { bg: "Отзивът е изтрит.", en: "Review deleted." },
  { bg: "Отзивът е обновен.", en: "Review updated." },
  { bg: "Изтрий този отзив?", en: "Delete this review?" },
  { bg: "Изтрий отзив", en: "Delete review" },
  { bg: "Запази", en: "Save" },
  { bg: "Отказ", en: "Cancel" },
  { bg: "Редактирай", en: "Edit" },
  { bg: "Изтрий", en: "Delete" },
  { bg: "Име", en: "Name" },
  { bg: "Имейл", en: "Email" },
  { bg: "Парола", en: "Password" },
  { bg: "Потвърди парола", en: "Confirm password" },
  { bg: "Пълно име", en: "Full name" },
  { bg: "Телефон", en: "Phone" },
  { bg: "Адрес", en: "Address" },
  { bg: "Град", en: "City" },
  { bg: "Държава", en: "Country" },
  { bg: "Пощенски код", en: "Postal code" },
  { bg: "Влез в профила си в HygiaTrade", en: "Sign in to your HygiaTrade account" },
  { bg: "Създай своя HygiaTrade профил", en: "Create your HygiaTrade account" },
  { bg: "Нов потребител?", en: "New here?" },
  { bg: "Вече имате профил?", en: "Already have an account?" },
  { bg: "Забравена парола?", en: "Forgot password?" },
  { bg: "Забравена парола?", en: "Forgot your password?" },
  { bg: "Влизане...", en: "Signing in..." },
  { bg: "Създаване на профил...", en: "Creating account..." },
  { bg: "Профилът е готов. Можете да влезете.", en: "Your account is ready. You can sign in now." },
  { bg: "Невалидни данни за вход", en: "Invalid credentials" },
  { bg: "Моля въведете валиден имейл и парола.", en: "Enter a valid email and password." },
  { bg: "Паролите не съвпадат.", en: "Passwords do not match." },
  { bg: "Минимум 8 символа", en: "At least 8 characters" },
  { bg: "Изпрати линк за нулиране", en: "Send reset link" },
  { bg: "Нулиране на парола", en: "Password reset" },
  { bg: "Избери нова парола", en: "Choose a new password" },
  { bg: "Нова парола", en: "New password" },
  { bg: "Нова парола (по избор)", en: "New password (optional)" },
  { bg: "Обнови паролата", en: "Update password" },
  { bg: "Обновяване на паролата...", en: "Updating password..." },
  { bg: "Паролата е обновена. Можете да влезете с новата.", en: "Your password has been updated. You can sign in with the new one now." },
  { bg: "Количката е празна", en: "Your cart is empty" },
  { bg: "Количката е празна.", en: "Your cart is empty." },
  { bg: "Продължи пазаруването", en: "Continue shopping" },
  { bg: "Към плащане", en: "Continue to checkout" },
  { bg: "Премахни от количката", en: "Remove from cart" },
  { bg: "Артикулът е премахнат от количката.", en: "Item removed from your cart." },
  { bg: "Няма активна количка.", en: "No active cart found." },
  { bg: "Не можахме да заредим количката.", en: "We could not load your cart." },
  { bg: "Поръчка", en: "Order" },
  { bg: "Поръчки", en: "Orders" },
  { bg: "Моите поръчки", en: "My orders" },
  { bg: "Обобщение на поръчката", en: "Order summary" },
  { bg: "Общо", en: "Total" },
  { bg: "Статус", en: "Status" },
  { bg: "Дата", en: "Date" },
  { bg: "Клиент", en: "Customer" },
  { bg: "Плащане", en: "Payment" },
  { bg: "Начин на плащане", en: "Payment method" },
  { bg: "Доставка", en: "Delivery" },
  { bg: "Начин на доставка", en: "Delivery method" },
  { bg: "Адрес за доставка", en: "Shipping address" },
  { bg: "Стандартен куриер", en: "Standard courier" },
  { bg: "Експресен куриер", en: "Express courier" },
  { bg: "Плащане с карта", en: "Card payment" },
  { bg: "Банков превод", en: "Bank transfer" },
  { bg: "Плати онлайн при подаване на поръчката.", en: "Pay online when you place the order." },
  { bg: "Получавате банкови данни след потвърждение на поръчката.", en: "Receive bank details after checkout confirmation." },
  { bg: "Постави поръчка", en: "Place order" },
  { bg: "Изпращане на поръчката...", en: "Placing order..." },
  { bg: "Поръчката е приета", en: "Order received" },
  { bg: "Поръчката е отказана.", en: "Order cancelled." },
  { bg: "Откажи поръчка", en: "Cancel order" },
  { bg: "Нямате поръчки все още.", en: "You haven’t placed any orders yet." },
  { bg: "Няма поръчки за показване.", en: "No orders to show." },
  { bg: "Не можахме да заредим поръчките.", en: "We could not load your orders." },
  { bg: "Не можахме да създадем поръчката.", en: "We could not place the order." },
  { bg: "Любимите са празни", en: "Your wishlist is empty" },
  { bg: "Запазвайте продукти тук, за да се върнете към тях по-късно.", en: "Save products here so you can come back to them later." },
  { bg: "Админ панел", en: "Admin workspace" },
  { bg: "HygiaTrade админ", en: "HygiaTrade admin" },
  { bg: "Табло", en: "Overview" },
  { bg: "Оперативен преглед", en: "Operational snapshot" },
  { bg: "Управление на продукти", en: "Manage products" },
  { bg: "Управление на категории", en: "Manage categories" },
  { bg: "Управление на клиенти", en: "Manage customers" },
  { bg: "Добави продукт", en: "Add product" },
  { bg: "Редактирай продукт", en: "Edit product" },
  { bg: "Изтрий продукт", en: "Delete product" },
  { bg: "Добави категория", en: "Add category" },
  { bg: "Редактирай категория", en: "Edit category" },
  { bg: "Изтрий категория", en: "Delete category" },
  { bg: "Добави клиент", en: "Add customer" },
  { bg: "Редактирай клиент", en: "Edit customer" },
  { bg: "Изтрий клиент", en: "Delete customer" },
  { bg: "Действия", en: "Actions" },
  { bg: "Наличност", en: "Stock" },
  { bg: "Отстъпка", en: "Discount" },
  { bg: "Цена (EUR)", en: "Price (EUR)" },
  { bg: "Редовна цена (EUR)", en: "Regular price (EUR)" },
  { bg: "Промо цена (EUR)", en: "Sale price (EUR)" },
  { bg: "Отстъпка (%)", en: "Discount (%)" },
  { bg: "Основен URL на изображение", en: "Main image URL" },
  { bg: "Вторични URL адреси на изображения", en: "Secondary image URLs" },
  { bg: "Вторичен URL на изображение", en: "Secondary image URL" },
  { bg: "+ Добави изображение", en: "+ Add image" },
  { bg: "Описание", en: "Description" },
  { bg: "Категория", en: "Category" },
  { bg: "Избери категория", en: "Choose category" },
  { bg: "Без категория", en: "Uncategorized" },
  { bg: "Поръчки днес", en: "Orders today" },
  { bg: "Активни клиенти", en: "Active customers" },
  { bg: "Приходи тази седмица", en: "Revenue this week" },
  { bg: "Продукти за презареждане", en: "Products to restock" },
  { bg: "Ниска наличност", en: "Low stock" },
  { bg: "Последни поръчки", en: "Latest orders" },
  { bg: "Няма скорошни поръчки.", en: "No recent orders yet." },
  { bg: "Всички проследявани продукти са над прага за ниска наличност.", en: "All tracked products are above the low-stock threshold." },
  { bg: "Обновен статус на поръчката.", en: "Order status updated." },
  { bg: "Клиенти", en: "Customers" },
  { bg: "Роля", en: "Role" },
  { bg: "Профил", en: "Account profile" },
  { bg: "Настройки на профила", en: "Account settings" },
  { bg: "Данните на профила са обновени.", en: "Account details updated." },
  { bg: "Запази промените", en: "Save changes" },
  { bg: "GDPR инструменти", en: "GDPR tools" },
  { bg: "Изтегли данните си", en: "Download your data" },
  { bg: "Изтрий профила", en: "Delete account" },
  { bg: "Изтрий и анонимизирай данните", en: "Delete and anonymize account data" },
  { bg: "Общи условия", en: "Terms of service" },
  { bg: "Прочети условията", en: "Read terms" },
  { bg: "Затвори", en: "Close" },
  { bg: "1. Общи условия", en: "1. General" },
  { bg: "2. Регистрация на профил", en: "2. Account registration" },
  { bg: "3. Поръчки и плащане", en: "3. Orders and payment" },
  { bg: "4. Доставка", en: "4. Delivery" },
  { bg: "5. Връщания и рекламации", en: "5. Returns and claims" },
  { bg: "6. Лични данни", en: "6. Personal data" },
];

const translations = pairs.reduce<Record<Language, Record<string, string>>>(
  (acc, pair) => {
    acc.bg[pair.en] = pair.bg;
    acc.bg[pair.bg] = pair.bg;
    acc.en[pair.bg] = pair.en;
    acc.en[pair.en] = pair.en;
    return acc;
  },
  { bg: {}, en: {} }
);

Object.assign(translations.bg, {
  "nav.home": "Начало",
  "nav.shop": "Магазин",
  "nav.about": "За нас",
  "nav.categories": "Категории",
  "nav.searchPlaceholder": "Търси по продукт или категория",
  "nav.searchProducts": "Търси продукти",
  "nav.admin": "Админ",
  "nav.openAdmin": "Отвори админ панел",
  "nav.cart": "Количка",
  "nav.account": "Профил",
  "nav.signIn": "Вход",
  "nav.signOut": "Изход",
  "nav.createAccount": "Регистрация",
  "nav.tagline": "Препарати за дома, офиса и бизнеса",
  "nav.languageShort": "BG",
  "nav.themeLight": "Светла",
  "nav.themeDark": "Тъмна",
  "footer.description": "Качествени почистващи препарати, перилни препарати и консумативи за дома, офиса и бизнеса, с ясна информация за продукти, наличности и цени.",
  "footer.store": "Магазин",
  "footer.products": "Продукти",
  "footer.about": "За нас",
  "footer.orderTracking": "Проследяване на поръчки",
  "footer.account": "Профил",
  "footer.customerCare": "Обслужване",
  "footer.delivery": "Доставка на почистващи и перилни препарати според наличностите.",
  "footer.clients": "Подходящи продукти за домакинства, офиси, магазини и бизнес клиенти.",
  "footer.support": "Поддръжка за въпроси относно продукти, поръчки и наличности.",
  "footer.rights": "Всички права запазени.",
  "footer.prices": "Цените и наличностите се обновяват редовно.",
});

Object.assign(translations.en, {
  "nav.home": "Home",
  "nav.shop": "Shop",
  "nav.about": "About",
  "nav.categories": "Categories",
  "nav.searchPlaceholder": "Search by product name or category",
  "nav.searchProducts": "Search products",
  "nav.admin": "Admin",
  "nav.openAdmin": "Open admin panel",
  "nav.cart": "Cart",
  "nav.account": "Account",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.createAccount": "Create account",
  "nav.tagline": "Cleaning products for home, office and business",
  "nav.languageShort": "EN",
  "nav.themeLight": "Light",
  "nav.themeDark": "Dark",
  "footer.description": "Quality cleaning products, laundry detergents and supplies for homes, offices and business clients, with clear product, stock and price information.",
  "footer.store": "Store",
  "footer.products": "Products",
  "footer.about": "About us",
  "footer.orderTracking": "Order tracking",
  "footer.account": "Account",
  "footer.customerCare": "Customer care",
  "footer.delivery": "Delivery of cleaning and laundry products based on current stock.",
  "footer.clients": "Suitable products for households, offices, shops and business clients.",
  "footer.support": "Support for product, order and availability questions.",
  "footer.rights": "All rights reserved.",
  "footer.prices": "Prices and stock levels are updated regularly.",
});

interface LanguageThemeContextValue {
  language: Language;
  theme: ThemeMode;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  t: (key: TranslationKey) => string;
  tr: (bg: string, en: string) => string;
}

const LanguageThemeContext = createContext<LanguageThemeContextValue | null>(
  null
);

const LANGUAGE_KEY = "lang";
const THEME_KEY = "theme";

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "bg";
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return stored === "en" || stored === "bg" ? stored : "bg";
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : "light";
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const translateExact = (value: string, language: Language) => {
  const clean = normalize(value);
  return translations[language][clean] ?? clean;
};

const translateTemplate = (value: string, language: Language) => {
  const raw = value;
  const trimmed = normalize(raw);
  if (!trimmed) return value;

  const translated = translateExact(trimmed, language);
  if (translated !== trimmed) {
    return raw.replace(trimmed, translated);
  }

  const maxMatch = trimmed.match(/^\(Maximum: (.+) pcs\)$/);
  if (maxMatch) {
    return language === "bg" ? `(Максимум: ${maxMatch[1]} бр.)` : `(Maximum: ${maxMatch[1]} pcs)`;
  }

  const pageMatch = trimmed.match(/^Page (.+) of (.+)$/);
  if (pageMatch) {
    return language === "bg" ? `Страница ${pageMatch[1]} от ${pageMatch[2]}` : `Page ${pageMatch[1]} of ${pageMatch[2]}`;
  }

  return value;
};

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName.toLowerCase();
  return ["script", "style", "textarea", "code", "pre", "svg"].includes(tag);
};

const translateElementAttributes = (element: Element, language: Language) => {
  ["placeholder", "title", "aria-label"].forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const translated = translateTemplate(value, language);
    if (translated !== value) {
      element.setAttribute(attribute, translated);
    }
  });
};

const translateDom = (language: Language) => {
  if (typeof document === "undefined") return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!shouldSkipTextNode(node)) {
      textNodes.push(node);
    }
  }

  textNodes.forEach((node) => {
    const translated = translateTemplate(node.nodeValue ?? "", language);
    if (translated !== node.nodeValue) {
      node.nodeValue = translated;
    }
  });

  document
    .querySelectorAll("[placeholder], [title], [aria-label]")
    .forEach((element) => translateElementAttributes(element, language));
};

export const LanguageThemeProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_KEY, language);

    window.setTimeout(() => translateDom(language), 0);

    const observer = new MutationObserver(() => translateDom(language));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
    window.dispatchEvent(new Event("themechange"));
  }, [theme]);

  const value = useMemo<LanguageThemeContextValue>(
    () => ({
      language,
      theme,
      setLanguage: setLanguageState,
      toggleLanguage: () =>
        setLanguageState((current) => (current === "bg" ? "en" : "bg")),
      toggleTheme: () =>
        setTheme((current) => (current === "dark" ? "light" : "dark")),
      t: (key) => translations[language][key] ?? key,
      tr: (bg, en) => (language === "bg" ? bg : en),
    }),
    [language, theme]
  );

  return (
    <LanguageThemeContext.Provider value={value}>
      {children}
    </LanguageThemeContext.Provider>
  );
};

export const useLanguageTheme = () => {
  const context = useContext(LanguageThemeContext);

  if (!context) {
    throw new Error("useLanguageTheme must be used inside LanguageThemeProvider");
  }

  return context;
};
