import { useEffect } from "react";
import { useLanguageTheme, type Language } from "./LanguageThemeContext";

type TextPair = { bg: string; en: string };

const extraPairs: TextPair[] = [
  { bg: "Марки", en: "Brands" },
  { bg: "Справки", en: "Reports" },
  { bg: "Управление на марки", en: "Manage brands" },
  { bg: "Създавай портфолио с марки, thumbnail изображение и описание.", en: "Build a brand portfolio with an image and description." },
  { bg: "Добави марка", en: "Add brand" },
  { bg: "Редактирай марка", en: "Edit brand" },
  { bg: "Изтриване на марка", en: "Delete brand" },
  { bg: "Thumbnail изображение", en: "Brand image" },
  { bg: "Няма thumbnail", en: "No image" },
  { bg: "Качи thumbnail от компютъра", en: "Upload image from device" },
  { bg: "Избери, пусни или постави изображение с Ctrl+V", en: "Choose, drop or paste an image with Ctrl+V" },
  { bg: "Пусни изображението тук", en: "Drop the image here" },
  { bg: "File Explorer / drag & drop / clipboard", en: "File Explorer / drag & drop / clipboard" },
  { bg: "Кратко описание на марката...", en: "Short brand description..." },
  { bg: "Запазване...", en: "Saving..." },
  { bg: "Марка", en: "Brand" },
  { bg: "Управление на марки", en: "Manage brands" },
  { bg: "Без марка", en: "No brand" },
  { bg: "Всички марки", en: "All brands" },
  { bg: "+ Добави нова марка", en: "+ Add new brand" },
  { bg: "Име на новата марка", en: "New brand name" },
  { bg: "Създай", en: "Create" },
  { bg: "Създаване...", en: "Creating..." },
  { bg: "Новата марка се записва веднага и се избира за текущия продукт.", en: "The new brand is saved immediately and selected for the current product." },
  { bg: "Избери или напиши нова категория...", en: "Choose or enter a new category..." },
  { bg: "Управление на категории", en: "Manage categories" },
  { bg: "Няма намерени категории.", en: "No categories found." },
  { bg: "Напиши ново име и натисни Enter или избери „Създай нова категория“.", en: "Enter a new name and press Enter or choose “Create new category”." },
  { bg: "Активен", en: "Active" },
  { bg: "Неактивен", en: "Inactive" },
  { bg: "Продуктът се показва в магазина.", en: "The product is visible in the store." },
  { bg: "Продуктът остава в админ панела, но е скрит от магазина.", en: "The product remains in the admin panel but is hidden from the store." },
  { bg: "Сортиране по:", en: "Sort by:" },
  { bg: "Ред:", en: "Order:" },
  { bg: "Цена от", en: "Price from" },
  { bg: "Цена до", en: "Price to" },
  { bg: "Изчисти", en: "Clear" },
  { bg: "Цена на дребно", en: "Retail price" },
  { bg: "Цена на едро", en: "Wholesale price" },
  { bg: "Редовна цена с ДДС", en: "Regular price incl. VAT" },
  { bg: "Промоционална цена", en: "Promotional price" },
  { bg: "Клиентът спестява", en: "Customer saves" },
  { bg: "Сумата на отстъпката в EUR", en: "Discount amount in EUR" },
  { bg: "Цена без ДДС", en: "Price excl. VAT" },
  { bg: "ДДС сума", en: "VAT amount" },
  { bg: "Крайна цена с ДДС", en: "Final price incl. VAT" },
  { bg: "ДДС ставка", en: "VAT rate" },
  { bg: "Цени", en: "Prices" },
  { bg: "Снимки на продукта", en: "Product images" },
  { bg: "Избери снимки, пусни ги тук или натисни Ctrl+V", en: "Choose images, drop them here or press Ctrl+V" },
  { bg: "Пусни снимките тук", en: "Drop the images here" },
  { bg: "Галерия / File Explorer / буфер за копиране", en: "Gallery / File Explorer / clipboard" },
  { bg: "До 10 MB на снимка. Файловете се качват автоматично веднага след избор, пускане или поставяне от буфера.", en: "Up to 10 MB per image. Files upload automatically after selection, drop or paste." },
  { bg: "Подреди снимките чрез избор 1, 2, 3...", en: "Order images by selecting 1, 2, 3..." },
  { bg: "Натискай снимките в желания ред: 1, 2, 3...", en: "Tap the images in the desired order: 1, 2, 3..." },
  { bg: "Номерът върху снимката показва избраната позиция.", en: "The number on the image shows its selected position." },
  { bg: "Готово", en: "Done" },
  { bg: "Качени снимки — плъзни карта върху желаното място", en: "Uploaded images — drag a card to the desired position" },
  { bg: "Основна", en: "Main" },
  { bg: "Направи основна", en: "Set as main" },
  { bg: "Премахни снимката", en: "Remove image" },
  { bg: "Следене на наличности, движения по фактури и продажби.", en: "Track stock, invoice movements and sales." },
  { bg: "Експорт CSV", en: "Export CSV" },
  { bg: "От дата", en: "From date" },
  { bg: "До дата", en: "To date" },
  { bg: "Ниска наличност до", en: "Low stock threshold" },
  { bg: "Обнови", en: "Refresh" },
  { bg: "Бройки в наличност", en: "Units in stock" },
  { bg: "Добавени за периода", en: "Received in period" },
  { bg: "Продадени за периода", en: "Sold in period" },
  { bg: "Оборот", en: "Revenue" },
  { bg: "Изчерпани продукти", en: "Out-of-stock products" },
  { bg: "Наличности", en: "Inventory" },
  { bg: "Продажби", en: "Sales" },
  { bg: "Зареждания / фактури", en: "Stock receipts / invoices" },
  { bg: "Търси продукт или фактура", en: "Search product or invoice" },
  { bg: "Търси продукт", en: "Search product" },
  { bg: "Име или № фактура...", en: "Name or invoice no..." },
  { bg: "Име на продукт...", en: "Product name..." },
  { bg: "Само ниска наличност", en: "Low stock only" },
  { bg: "На страница", en: "Per page" },
  { bg: "Текуща наличност", en: "Current stock" },
  { bg: "Добавено", en: "Received" },
  { bg: "Продадено", en: "Sold" },
  { bg: "Нетно движение", en: "Net movement" },
  { bg: "Продадени бройки", en: "Units sold" },
  { bg: "Фактура", en: "Invoice" },
  { bg: "Добавено количество", en: "Received quantity" },
  { bg: "Няма данни за избраните филтри.", en: "No data matches the selected filters." },
  { bg: "Напред", en: "Next" },
  { bg: "Справката не можа да бъде заредена.", en: "The report could not be loaded." },
  { bg: "Търси по име", en: "Search by name" },
  { bg: "Управление на продукти", en: "Manage products" },
  { bg: "Управление на клиенти", en: "Manage customers" },
  { bg: "Управление на категории", en: "Manage categories" },
  { bg: "Управление на поръчки", en: "Manage orders" },
  { bg: "Добави клиент", en: "Add customer" },
  { bg: "Редактирай клиент", en: "Edit customer" },
  { bg: "Повече информация", en: "More information" },
  { bg: "Свързани поръчки", en: "Associated orders" },
  { bg: "Няма свързани поръчки.", en: "No associated orders." },
  { bg: "Телефон", en: "Phone" },
  { bg: "Роля", en: "Role" },
  { bg: "Действия", en: "Actions" },
  { bg: "Клиент", en: "Customer" },
  { bg: "Админ", en: "Admin" },
  { bg: "Изтрий избраните", en: "Delete selected" },
  { bg: "Няма продукти за показване.", en: "No products to show." },
  { bg: "Без категория", en: "Uncategorized" },
  { bg: "Няма наличност", en: "Out of stock" },
  { bg: "Ограничена наличност", en: "Low stock" },
  { bg: "В наличност", en: "In stock" },
  { bg: "Добави в количката", en: "Add to cart" },
  { bg: "В количката", en: "Add to cart" },
  { bg: "Любими", en: "Wishlist" },
  { bg: "Сравни", en: "Compare" },
  { bg: "Всички категории", en: "All categories" },
  { bg: "Филтриране", en: "Filtering" },
  { bg: "Филтриране на продуктите", en: "Refine the catalog" },
  { bg: "Резултатите се обновяват автоматично при промяна на филтрите.", en: "Results update automatically as you change the filters." },
  { bg: "Ценови диапазон", en: "Price range" },
  { bg: "Най-популярни", en: "Most popular" },
  { bg: "Цена: ниска към висока", en: "Price: low to high" },
  { bg: "Цена: висока към ниска", en: "Price: high to low" },
  { bg: "Покажи:", en: "View:" },
  { bg: "Компактен списък", en: "Compact list" },
  { bg: "Подробен списък", en: "Detailed list" },
  { bg: "Карти", en: "Grid" },
  { bg: "Отвори меню", en: "Open menu" },
  { bg: "Затвори меню", en: "Close menu" },
  { bg: "Смени езика", en: "Change language" },
  { bg: "Смени темата", en: "Change theme" }
];

const buildTranslations = () =>
  extraPairs.reduce<Record<Language, Record<string, string>>>(
    (acc, pair) => {
      acc.bg[pair.bg] = pair.bg;
      acc.bg[pair.en] = pair.bg;
      acc.en[pair.bg] = pair.en;
      acc.en[pair.en] = pair.en;
      return acc;
    },
    { bg: {}, en: {} }
  );

const translations = buildTranslations();
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const translateDynamic = (value: string, language: Language) => {
  const clean = normalize(value);
  const exact = translations[language][clean];
  if (exact) return exact;

  let match = clean.match(/^Страница (\d+) от (\d+)$/i) || clean.match(/^Page (\d+) of (\d+)$/i);
  if (match) return language === "bg" ? `Страница ${match[1]} от ${match[2]}` : `Page ${match[1]} of ${match[2]}`;

  match = clean.match(/^(\d+) записа$/i) || clean.match(/^(\d+) records$/i);
  if (match) return language === "bg" ? `${match[1]} записа` : `${match[1]} records`;

  match = clean.match(/^(\d+) продукта$/i) || clean.match(/^(\d+) products$/i);
  if (match) return language === "bg" ? `${match[1]} продукта` : `${match[1]} products`;

  match = clean.match(/^\+ Създай нова категория „(.+)“$/i) || clean.match(/^\+ Create new category “(.+)”$/i);
  if (match) return language === "bg" ? `+ Създай нова категория „${match[1]}“` : `+ Create new category “${match[1]}”`;

  match = clean.match(/^продукта с (\d+) или по-малко бройки$/i) || clean.match(/^products with (\d+) or fewer units$/i);
  if (match) return language === "bg" ? `продукта с ${match[1]} или по-малко бройки` : `products with ${match[1]} or fewer units`;

  if (clean === "продукта с наличност 0" || clean === "products with stock 0") {
    return language === "bg" ? "продукта с наличност 0" : "products with stock 0";
  }

  return value;
};

const shouldSkip = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  const tag = parent.tagName.toLowerCase();
  return ["script", "style", "textarea", "code", "pre", "svg"].includes(tag);
};

const translateDocument = (language: Language) => {
  if (typeof document === "undefined") return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!shouldSkip(node)) nodes.push(node);
  }

  nodes.forEach((node) => {
    const raw = node.nodeValue ?? "";
    const clean = normalize(raw);
    if (!clean) return;
    const translated = translateDynamic(clean, language);
    if (translated !== clean) node.nodeValue = raw.replace(clean, translated);
  });

  document.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      const raw = element.getAttribute(attribute);
      if (!raw) return;
      const translated = translateDynamic(raw, language);
      if (translated !== raw) element.setAttribute(attribute, translated);
    });
  });
};

const GlobalUiEnhancer = () => {
  const { language } = useLanguageTheme();

  useEffect(() => {
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => translateDocument(language));
    };

    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);

  return null;
};

export default GlobalUiEnhancer;
