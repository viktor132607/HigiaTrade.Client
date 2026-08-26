import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../../config/api";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Category = {
  id: string;
  name: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
};

type Target = {
  input: HTMLInputElement;
  container: HTMLElement;
  mount: HTMLDivElement;
};

const setNativeValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const ProductCategoryHierarchyEnhancer = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [categories, setCategories] = useState<Category[]>([]);
  const [target, setTarget] = useState<Target | null>(null);
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Categories`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    };
    void load();
  }, []);

  const parents = useMemo(
    () => categories.filter((category) => !category.parentCategoryId).sort((a, b) => a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" })),
    [categories]
  );

  const children = useMemo(
    () => categories.filter((category) => category.parentCategoryId === mainCategoryId).sort((a, b) => a.name.localeCompare(b.name, "bg-BG", { sensitivity: "base" })),
    [categories, mainCategoryId]
  );

  useEffect(() => {
    let active: Target | null = null;

    const detach = () => {
      if (!active) return;
      active.container.style.display = "";
      delete active.container.dataset.categoryHierarchyEnhanced;
      active.mount.remove();
      active = null;
      setTarget(null);
      setMainCategoryId("");
      setSubcategoryId("");
    };

    const attach = () => {
      if (active && document.body.contains(active.mount)) return;
      if (active) detach();

      const heading = Array.from(document.querySelectorAll("h2")).find((element) =>
        ["Редактирай продукт", "Добави продукт", "Edit product", "Add product"].includes(element.textContent?.trim() ?? "")
      );
      const form = heading?.parentElement?.querySelector("form") ?? heading?.closest("div")?.querySelector("form");
      if (!(form instanceof HTMLFormElement)) return;

      const label = Array.from(form.querySelectorAll("label")).find((element) => (element.textContent?.trim() ?? "") === "Категория");
      const container = label?.closest("div.relative") as HTMLElement | null;
      const input = container?.querySelector("input[type='text']") as HTMLInputElement | null;
      if (!container || !input || container.dataset.categoryHierarchyEnhanced === "true") return;

      const mount = document.createElement("div");
      mount.dataset.categoryHierarchyMount = "true";
      container.dataset.categoryHierarchyEnhanced = "true";
      container.insertAdjacentElement("afterend", mount);
      container.style.display = "none";
      active = { input, container, mount };
      setTarget(active);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); detach(); };
  }, [language]);

  useEffect(() => {
    if (!target || categories.length === 0) return;
    const currentName = target.input.value.trim();
    if (!currentName) return;
    const current = categories.find((category) => category.name === currentName);
    if (!current) return;
    if (current.parentCategoryId) {
      setMainCategoryId(current.parentCategoryId);
      setSubcategoryId(current.id);
    } else {
      setMainCategoryId(current.id);
      setSubcategoryId("");
    }
  }, [target, categories]);

  if (!target) return null;

  const selectLegacy = (category: Category) => {
    setNativeValue(target.input, category.name);
    window.setTimeout(() => {
      const buttons = Array.from(target.container.querySelectorAll("button"));
      const option = buttons.find((button) => button.textContent?.trim() === category.name);
      option?.click();
    }, 0);
  };

  const chooseMain = (id: string) => {
    setMainCategoryId(id);
    setSubcategoryId("");
    const category = parents.find((item) => item.id === id);
    if (category) selectLegacy(category);
    else setNativeValue(target.input, "");
  };

  const chooseSubcategory = (id: string) => {
    setSubcategoryId(id);
    if (!id) {
      const parent = parents.find((item) => item.id === mainCategoryId);
      if (parent) selectLegacy(parent);
      return;
    }
    const category = categories.find((item) => item.id === id);
    if (category) selectLegacy(category);
  };

  return createPortal(
    <div className="space-y-3 rounded-lg border border-slate-300 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{isBg ? "Категория и подкатегория" : "Category and subcategory"}</div>
        <div className="flex gap-3 text-xs font-semibold"><a href="/admin/categories" className="text-[#18b99f] hover:underline">{isBg ? "Категории" : "Categories"}</a><a href="/admin/subcategories" className="text-[#18b99f] hover:underline">{isBg ? "Подкатегории" : "Subcategories"}</a></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          {isBg ? "Категория" : "Category"}
          <select value={mainCategoryId} onChange={(event) => chooseMain(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20">
            <option value="">{isBg ? "Избери категория" : "Choose category"}</option>
            {parents.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-800">
          {isBg ? "Подкатегория" : "Subcategory"}
          <select value={subcategoryId} onChange={(event) => chooseSubcategory(event.target.value)} disabled={!mainCategoryId || children.length === 0} className="min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20">
            <option value="">{children.length > 0 ? (isBg ? "Без подкатегория" : "No subcategory") : (isBg ? "Няма подкатегории" : "No subcategories")}</option>
            {children.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">{isBg ? "Ако избереш подкатегория, продуктът се записва в нея и автоматично принадлежи към основната категория." : "Selecting a subcategory assigns the product to it and its main category."}</p>
    </div>,
    target.mount
  );
};

export default ProductCategoryHierarchyEnhancer;
