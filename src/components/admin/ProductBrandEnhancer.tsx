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

type BrandOption = {
  name: string;
  productCount: number;
};

type ProductListItem = {
  title: string;
  brand?: string | null;
};

const ProductBrandEnhancer = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [target, setTarget] = useState<Target | null>(null);
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const targetRef = useRef<Target | null>(null);
  const brandRef = useRef("");

  useEffect(() => {
    brandRef.current = brand;
  }, [brand]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`);
        if (response.ok) setBrands(await response.json());
      } catch {
        // Brand suggestions are optional; the field still works without them.
      }
    };

    void loadBrands();
  }, []);

  useEffect(() => {
    let active: Target | null = null;

    const detach = () => {
      if (!active) return;
      active.mount.remove();
      active = null;
      targetRef.current = null;
      setTarget(null);
      setBrand("");
    };

    const attach = async () => {
      if (active && document.body.contains(active.mount)) return;
      if (active) detach();

      const labels = Array.from(document.querySelectorAll("label"));
      const nameLabel = labels.find((label) => label.textContent?.trim() === "Име");
      const nameContainer = nameLabel?.parentElement;
      const nameInput = nameContainer?.querySelector("input[type='text']") as HTMLInputElement | null;
      const form = nameContainer?.closest("form") as HTMLFormElement | null;

      if (!nameContainer || !nameInput || !form) return;
      if (form.querySelector("[data-product-brand-enhancer='true']")) return;

      const mount = document.createElement("div");
      mount.dataset.productBrandEnhancer = "true";
      nameContainer.insertAdjacentElement("afterend", mount);

      const heading = form.parentElement?.querySelector("h2")?.textContent?.trim() ?? "";
      const isEditing = heading.includes("Редактирай");
      active = { form, mount, nameInput, isEditing };
      targetRef.current = active;
      setTarget(active);
      setBrand("");

      if (!isEditing || !nameInput.value.trim()) return;

      try {
        const query = new URLSearchParams({
          Title: nameInput.value.trim(),
          PageNumber: "1",
          PageSize: "100",
          SortBy: "title",
          SortDescending: "false",
        });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (!response.ok) return;
        const payload = await response.json();
        const items: ProductListItem[] = Array.isArray(payload.items) ? payload.items : [];
        const exact = items.find(
          (item) => item.title.trim().toLocaleLowerCase("bg-BG") === nameInput.value.trim().toLocaleLowerCase("bg-BG")
        );
        if (exact?.brand) setBrand(exact.brand);
      } catch {
        // Keep the field editable even when the lookup fails.
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
      const current = targetRef.current;
      if (!current || !init?.body || typeof init.body !== "string") {
        return originalFetch(input, init);
      }

      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init.method ?? "GET").toUpperCase();
      const isProductSave =
        (method === "POST" || method === "PUT") &&
        url.replace(/\/+$/, "").endsWith("/Products");

      if (!isProductSave) return originalFetch(input, init);

      try {
        const payload = JSON.parse(init.body);
        payload.brand = brandRef.current.trim();
        return originalFetch(input, { ...init, body: JSON.stringify(payload) });
      } catch {
        return originalFetch(input, init);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <div>
      <label className="block text-sm font-semibold text-gray-800">Марка</label>
      <input
        type="text"
        value={brand}
        onChange={(event) => setBrand(event.target.value)}
        list="product-brand-options"
        placeholder="Напр. Sano, Ariel, Cif..."
        autoComplete="off"
        className="mt-1 block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20"
      />
      <datalist id="product-brand-options">
        {brands.map((item) => (
          <option key={item.name} value={item.name} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-gray-500">Използва се за групиране на продуктите в раздел „По марка“.</p>
    </div>,
    target.mount
  );
};

export default ProductBrandEnhancer;
