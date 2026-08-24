import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import ProductStockManager from "./ProductStockManager";

type StockTarget = {
  stockInput: HTMLInputElement;
  container: HTMLElement;
  mount: HTMLDivElement;
  productTitle: string;
};

const ProductStockEnhancer = () => {
  const { token } = useSelector((state: RootState) => state.auth);
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
      if (
        activeTarget &&
        document.body.contains(activeTarget.stockInput) &&
        document.body.contains(activeTarget.mount)
      ) {
        return;
      }

      if (activeTarget) detach();

      const modalHeading = Array.from(document.querySelectorAll("h2")).find(
        (heading) => heading.textContent?.trim() === "Редактирай продукт"
      );
      if (!modalHeading) return;

      const stockInput = document.querySelector<HTMLInputElement>('input[name="stock"]');
      const nameInput = document.querySelector<HTMLInputElement>('input[name="name"]');

      if (
        !stockInput ||
        !nameInput ||
        stockInput.dataset.stockEnhancerSource === "true"
      ) {
        return;
      }

      const container = stockInput.parentElement;
      if (!container) return;

      const mount = document.createElement("div");
      mount.dataset.stockEnhancer = "true";
      stockInput.dataset.stockEnhancerSource = "true";
      container.insertAdjacentElement("afterend", mount);
      container.style.display = "none";

      activeTarget = {
        stockInput,
        container,
        mount,
        productTitle: nameInput.value.trim(),
      };

      setCurrentQuantity(Number.parseInt(stockInput.value, 10) || 0);
      setTarget(activeTarget);
    };

    attach();

    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detach();
    };
  }, []);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;

    const resolveProduct = async () => {
      try {
        setProductId(null);
        setResolveError("");

        const query = new URLSearchParams({
          PageNumber: "1",
          PageSize: "100",
          Title: target.productTitle,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );

        if (!response.ok) {
          throw new Error("Продуктът не можа да бъде намерен.");
        }

        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const stockValue = Number.parseInt(target.stockInput.value, 10) || 0;

        const exactProduct =
          items.find(
            (item: any) =>
              item?.title === target.productTitle &&
              Number(item?.quantity) === stockValue
          ) ?? items.find((item: any) => item?.title === target.productTitle);

        if (!exactProduct?.id) {
          throw new Error("Продуктът не можа да бъде свързан с наличността.");
        }

        if (!cancelled) {
          setProductId(String(exactProduct.id));
          setCurrentQuantity(Number(exactProduct.quantity) || stockValue);
        }
      } catch (error) {
        if (!cancelled) {
          setResolveError(
            error instanceof Error
              ? error.message
              : "Наличността не можа да бъде заредена."
          );
        }
      }
    };

    void resolveProduct();

    return () => {
      cancelled = true;
    };
  }, [target, token]);

  if (!target) return null;

  const updateLegacyStock = (quantity: number) => {
    setCurrentQuantity(quantity);

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    setter?.call(target.stockInput, String(quantity));
    target.stockInput.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return createPortal(
    productId ? (
      <ProductStockManager
        token={token}
        productId={productId}
        currentQuantity={currentQuantity}
        onQuantityChange={updateLegacyStock}
      />
    ) : (
      <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-gray-600">
        {resolveError || "Зареждане на наличността..."}
      </div>
    ),
    target.mount
  );
};

export default ProductStockEnhancer;
