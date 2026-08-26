import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import ProductStockManager from "./ProductStockManager";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type StockTarget = {
  stockInput: HTMLInputElement;
  container: HTMLElement;
  mount: HTMLDivElement;
  productTitle: string;
  isEditing: boolean;
};

const setNativeInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const ProductStockEnhancer = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [target, setTarget] = useState<StockTarget | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    let activeTarget: StockTarget | null = null;

    const detach = () => {
      if (!activeTarget) return;
      activeTarget.container.style.display = "";
      activeTarget.stockInput.removeAttribute("data-stock-enhancer-source");
      activeTarget.mount.remove();
      activeTarget = null;
      setTarget(null);
      setProductId(null);
      setResolveError("");
    };

    const attach = () => {
      if (activeTarget && document.body.contains(activeTarget.stockInput) && document.body.contains(activeTarget.mount)) return;
      if (activeTarget) detach();

      const modalHeading = Array.from(document.querySelectorAll("h2")).find((heading) => {
        const text = heading.textContent?.trim() ?? "";
        return ["Редактирай продукт", "Добави продукт", "Edit product", "Add product"].includes(text);
      });
      if (!modalHeading) return;

      const headingText = modalHeading.textContent?.trim() ?? "";
      const isEditing = headingText === "Редактирай продукт" || headingText === "Edit product";
      const form = modalHeading.parentElement?.querySelector("form") ?? modalHeading.closest("div")?.querySelector("form");
      const stockInput = (form ?? document).querySelector<HTMLInputElement>('input[name="stock"]');
      const nameInput = (form ?? document).querySelector<HTMLInputElement>('input[name="name"]');
      if (!stockInput || !nameInput || stockInput.dataset.stockEnhancerSource === "true") return;

      const container = stockInput.parentElement;
      if (!container) return;
      const mount = document.createElement("div");
      mount.dataset.stockEnhancer = "true";
      stockInput.dataset.stockEnhancerSource = "true";
      container.insertAdjacentElement("afterend", mount);
      container.style.display = "none";

      if (!isEditing) setNativeInputValue(stockInput, "0");

      activeTarget = { stockInput, container, mount, productTitle: nameInput.value.trim(), isEditing };
      setCurrentQuantity(isEditing ? Number.parseInt(stockInput.value, 10) || 0 : 0);
      setTarget(activeTarget);
    };

    attach();
    const observer = new MutationObserver(() => { if (!activeTarget || !document.body.contains(activeTarget.mount)) attach(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); detach(); };
  }, [language]);

  useEffect(() => {
    if (!target || !target.isEditing) {
      setProductId(null);
      setResolveError("");
      return;
    }

    let cancelled = false;
    const resolveProduct = async () => {
      try {
        setProductId(null);
        setResolveError("");
        const query = new URLSearchParams({ PageNumber: "1", PageSize: "100", Title: target.productTitle });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!response.ok) throw new Error(isBg ? "Продуктът не можа да бъде намерен." : "The product could not be found.");

        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const stockValue = Number.parseInt(target.stockInput.value, 10) || 0;
        const exactProduct = items.find((item: any) => item?.title === target.productTitle && Number(item?.quantity) === stockValue) ?? items.find((item: any) => item?.title === target.productTitle);
        if (!exactProduct?.id) throw new Error(isBg ? "Продуктът не можа да бъде свързан с наличността." : "The product could not be matched to its stock record.");

        if (!cancelled) {
          setProductId(String(exactProduct.id));
          setCurrentQuantity(Number(exactProduct.quantity) || 0);
        }
      } catch (error) {
        if (!cancelled) setResolveError(error instanceof Error ? error.message : (isBg ? "Наличността не можа да бъде заредена." : "Stock could not be loaded."));
      }
    };

    void resolveProduct();
    return () => { cancelled = true; };
  }, [target, token, isBg]);

  if (!target) return null;

  const updateLegacyStock = (quantity: number) => {
    setCurrentQuantity(quantity);
    setNativeInputValue(target.stockInput, String(quantity));
  };

  return createPortal(
    !target.isEditing ? (
      <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-gray-700 sm:p-4">
        <div className="font-semibold">{isBg ? "Начална наличност: 0 бр." : "Initial stock: 0 units"}</div>
        <div className="mt-1 leading-5 text-gray-500">{isBg ? "Запази продукта, след което добави реалното количество от „Наличност“ — с фактура или без фактура (0000000000)." : "Save the product, then add the actual quantity from Stock — with an invoice or without one (0000000000)."}</div>
      </div>
    ) : productId ? (
      <ProductStockManager token={token} productId={productId} currentQuantity={currentQuantity} onQuantityChange={updateLegacyStock} />
    ) : (
      <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-gray-600 sm:p-4">{resolveError || (isBg ? "Зареждане на наличността..." : "Loading stock...")}</div>
    ),
    target.mount
  );
};

export default ProductStockEnhancer;
