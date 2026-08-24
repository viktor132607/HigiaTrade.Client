import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type Target = {
  form: HTMLFormElement;
  mount: HTMLDivElement;
  nameInput: HTMLInputElement;
  isEditing: boolean;
};

type ProductListItem = {
  id: string;
  title: string;
};

type StatusResponse = {
  isNewProduct?: boolean;
  displayDays?: number;
  activeUntilUtc?: string | null;
  isCurrentlyNew?: boolean;
};

const clampDays = (value: number) => Math.min(365, Math.max(1, value || 14));

const ProductNewStatusEnhancer = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [target, setTarget] = useState<Target | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [displayDays, setDisplayDays] = useState(14);
  const [activeUntil, setActiveUntil] = useState<string | null>(null);

  const targetRef = useRef<Target | null>(null);
  const isNewProductRef = useRef(false);
  const displayDaysRef = useRef(14);

  useEffect(() => {
    isNewProductRef.current = isNewProduct;
  }, [isNewProduct]);

  useEffect(() => {
    displayDaysRef.current = displayDays;
  }, [displayDays]);

  useEffect(() => {
    let active: Target | null = null;

    const detach = () => {
      if (!active) return;
      active.mount.remove();
      active = null;
      targetRef.current = null;
      setTarget(null);
      setIsNewProduct(false);
      setDisplayDays(14);
      setActiveUntil(null);
    };

    const attach = async () => {
      if (active && document.body.contains(active.mount)) return;
      if (active) detach();

      const labels = Array.from(document.querySelectorAll("label"));
      const statusLabel = labels.find((label) => label.textContent?.trim() === "Статус");
      const statusContainer = statusLabel?.parentElement;
      const form = statusContainer?.closest("form") as HTMLFormElement | null;
      const nameLabel = labels.find((label) => label.textContent?.trim() === "Име");
      const nameInput = nameLabel?.parentElement?.querySelector("input[type='text']") as HTMLInputElement | null;

      if (!statusContainer || !form || !nameInput) return;
      if (form.querySelector("[data-product-new-status-enhancer='true']")) return;

      const mount = document.createElement("div");
      mount.dataset.productNewStatusEnhancer = "true";
      statusContainer.insertAdjacentElement("afterend", mount);

      const heading = form.parentElement?.querySelector("h2")?.textContent?.trim() ?? "";
      const isEditing = heading.includes("Редактирай");
      active = { form, mount, nameInput, isEditing };
      targetRef.current = active;
      setTarget(active);
      setIsNewProduct(false);
      setDisplayDays(14);
      setActiveUntil(null);

      if (!isEditing || !nameInput.value.trim()) return;

      try {
        const query = new URLSearchParams({
          Title: nameInput.value.trim(),
          PageNumber: "1",
          PageSize: "100",
          SortBy: "title",
          SortDescending: "false",
        });
        const productResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (!productResponse.ok) return;

        const payload = await productResponse.json();
        const items: ProductListItem[] = Array.isArray(payload.items) ? payload.items : [];
        const exact = items.find(
          (item) => item.title.trim().toLocaleLowerCase("bg-BG") === nameInput.value.trim().toLocaleLowerCase("bg-BG")
        );
        if (!exact?.id) return;

        const statusResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/NewProducts/status/${exact.id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (!statusResponse.ok) return;

        const status: StatusResponse = await statusResponse.json();
        setIsNewProduct(Boolean(status.isNewProduct));
        setDisplayDays(clampDays(Number(status.displayDays ?? 14)));
        setActiveUntil(status.activeUntilUtc ?? null);
      } catch {
        // The product form remains usable even if the optional status lookup fails.
      }
    };

    void attach();
    const observer = new MutationObserver(() => void attach());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      detach();
    };
  }, [token]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      const isProductSave =
        (method === "POST" || method === "PUT") &&
        url.replace(/\/+$/, "").endsWith("/Products") &&
        typeof init?.body === "string";

      if (!isProductSave) return originalFetch(input, init);

      const response = await originalFetch(input, init);
      if (!response.ok) return response;

      try {
        const requestPayload = JSON.parse(init!.body as string) as Record<string, unknown>;
        let productId = typeof requestPayload.id === "string" ? requestPayload.id : "";

        if (!productId) {
          const responsePayload = await response.clone().json().catch(() => null);
          productId = String(
            responsePayload?.id ??
            responsePayload?.data?.id ??
            responsePayload?.result?.id ??
            ""
          );
        }

        if (productId) {
          await originalFetch(
            `${process.env.NEXT_PUBLIC_API_URL}/NewProducts/status/${productId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                isNewProduct: isNewProductRef.current,
                displayDays: clampDays(displayDaysRef.current),
              }),
            }
          );
        }
      } catch (error) {
        console.error("Неуспешно записване на статуса „Нов продукт“:", error);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);

  if (!target) return null;

  return createPortal(
    <div className="rounded-lg border border-slate-300 bg-slate-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-800">Нов продукт</label>
          <p className="mt-1 text-xs text-gray-500">
            Показва продукта в раздел „Нови стоки“ само за зададения период.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewProduct((current) => !current)}
          className={`inline-flex min-w-36 items-center justify-center rounded-md px-4 py-2 font-semibold text-white ${
            isNewProduct
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-500 hover:bg-slate-600"
          }`}
        >
          {isNewProduct ? "Да" : "Не"}
        </button>
      </div>

      {isNewProduct && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-800">
            Показвай като нов за (дни)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            inputMode="numeric"
            value={displayDays}
            onChange={(event) => setDisplayDays(clampDays(Number(event.target.value)))}
            className="mt-1 block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
          />
          <p className="mt-1 text-xs text-gray-500">
            След изтичането продуктът остава активен, но вече не се показва като нов.
            {activeUntil ? ` Текущ срок: до ${new Date(activeUntil).toLocaleDateString("bg-BG")}.` : ""}
          </p>
        </div>
      )}
    </div>,
    target.mount
  );
};

export default ProductNewStatusEnhancer;
