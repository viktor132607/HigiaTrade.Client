import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Target = {
  form: HTMLFormElement;
  mount: HTMLDivElement;
  nameInput: HTMLInputElement;
  isEditing: boolean;
};

type BrandOption = {
  id?: string;
  name: string;
  productCount: number;
};

type ProductListItem = {
  title: string;
  brand?: string | null;
};

const ProductBrandEnhancer = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [target, setTarget] = useState<Target | null>(null);
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [brandCreateError, setBrandCreateError] = useState("");
  const targetRef = useRef<Target | null>(null);
  const brandRef = useRef("");

  useEffect(() => { brandRef.current = brand; }, [brand]);

  const loadBrands = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch {
      setBrands([]);
    }
  };

  useEffect(() => { void loadBrands(); }, []);

  const createBrand = async () => {
    const name = newBrandName.trim();
    if (creatingBrand) return;
    if (name.length < 2) {
      setBrandCreateError(isBg ? "Името на марката трябва да е поне 2 символа." : "Brand name must be at least 2 characters.");
      return;
    }

    const existing = brands.find((item) => item.name.trim().toLocaleLowerCase("bg-BG") === name.toLocaleLowerCase("bg-BG"));
    if (existing) {
      setBrand(existing.name);
      setNewBrandName("");
      setBrandCreateError("");
      setIsCreatingBrand(false);
      return;
    }

    try {
      setCreatingBrand(true);
      setBrandCreateError("");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, thumbnailImageUrl: null, description: null }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || (isBg ? "Марката не можа да бъде създадена." : "The brand could not be created."));

      const created: BrandOption = {
        id: data?.id ? String(data.id) : undefined,
        name: String(data?.name || name),
        productCount: Number(data?.productCount || 0),
      };
      setBrands((current) => [...current.filter((item) => item.name.toLocaleLowerCase("bg-BG") !== created.name.toLocaleLowerCase("bg-BG")), created].sort((a, b) => a.name.localeCompare(b.name, "bg-BG")));
      setBrand(created.name);
      setNewBrandName("");
      setIsCreatingBrand(false);
    } catch (error) {
      setBrandCreateError(error instanceof Error ? error.message : isBg ? "Марката не можа да бъде създадена." : "The brand could not be created.");
    } finally {
      setCreatingBrand(false);
    }
  };

  useEffect(() => {
    let active: Target | null = null;
    const detach = () => {
      if (!active) return;
      active.mount.remove();
      active = null;
      targetRef.current = null;
      setTarget(null);
      setBrand("");
      setIsCreatingBrand(false);
      setNewBrandName("");
      setBrandCreateError("");
    };

    const attach = async () => {
      if (active && document.body.contains(active.mount)) return;
      if (active) detach();
      const labels = Array.from(document.querySelectorAll("label"));
      const nameLabel = labels.find((label) => ["Име", "Name"].includes(label.textContent?.trim() ?? ""));
      const nameContainer = nameLabel?.parentElement;
      const nameInput = nameContainer?.querySelector("input[type='text']") as HTMLInputElement | null;
      const form = nameContainer?.closest("form") as HTMLFormElement | null;
      if (!nameContainer || !nameInput || !form || form.querySelector("[data-product-brand-enhancer='true']")) return;

      const mount = document.createElement("div");
      mount.dataset.productBrandEnhancer = "true";
      nameContainer.insertAdjacentElement("afterend", mount);
      const heading = form.parentElement?.querySelector("h2")?.textContent?.trim() ?? "";
      const isEditing = heading.includes("Редактирай") || heading.includes("Edit");
      active = { form, mount, nameInput, isEditing };
      targetRef.current = active;
      setTarget(active);
      setBrand("");

      if (!isEditing || !nameInput.value.trim()) return;
      try {
        const query = new URLSearchParams({ Title: nameInput.value.trim(), PageNumber: "1", PageSize: "100", SortBy: "title", SortDescending: "false" });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?${query.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!response.ok) return;
        const payload = await response.json();
        const items: ProductListItem[] = Array.isArray(payload.items) ? payload.items : [];
        const exact = items.find((item) => item.title.trim().toLocaleLowerCase("bg-BG") === nameInput.value.trim().toLocaleLowerCase("bg-BG"));
        if (exact?.brand) setBrand(exact.brand);
      } catch {
        // Optional lookup; product editing remains usable.
      }
    };

    void attach();
    const observer = new MutationObserver(() => void attach());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); detach(); };
  }, [token, language]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const current = targetRef.current;
      if (!current || !init?.body || typeof init.body !== "string") return originalFetch(input, init);
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init.method ?? "GET").toUpperCase();
      const isProductSave = (method === "POST" || method === "PUT") && url.replace(/\/+$/, "").endsWith("/Products");
      if (!isProductSave) return originalFetch(input, init);
      try {
        const payload = JSON.parse(init.body);
        payload.brand = brandRef.current.trim() || null;
        return originalFetch(input, { ...init, body: JSON.stringify(payload) });
      } catch {
        return originalFetch(input, init);
      }
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  if (!target) return null;

  return createPortal(
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-semibold text-gray-800">{isBg ? "Марка" : "Brand"}</label>
        <a href="/admin/brands" className="text-xs font-semibold text-[#18b99f] hover:underline">{isBg ? "Управление на марки" : "Manage brands"}</a>
      </div>
      <select value={brand} onChange={(event) => setBrand(event.target.value)} className="block min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-[#18b99f] focus:ring-2 focus:ring-[#18b99f]/20">
        <option value="">{isBg ? "Без марка" : "No brand"}</option>
        {brands.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.name}</option>)}
      </select>

      <div className="mt-2">
        {!isCreatingBrand ? (
          <button type="button" onClick={() => { setIsCreatingBrand(true); setNewBrandName(""); setBrandCreateError(""); }} className="min-h-10 text-sm font-semibold text-[#138b78] hover:underline">{isBg ? "+ Добави нова марка" : "+ Add new brand"}</button>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="text" value={newBrandName} onChange={(event) => { setNewBrandName(event.target.value); setBrandCreateError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createBrand(); } }} placeholder={isBg ? "Име на новата марка" : "New brand name"} maxLength={80} autoFocus className="min-h-11 flex-1 rounded-md border border-slate-400 bg-white px-3 py-2 text-sm outline-none focus:border-[#18b99f]" />
              <button type="button" onClick={() => void createBrand()} disabled={creatingBrand} className="min-h-11 rounded-md bg-[#18b99f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#149f8a] disabled:opacity-50">{creatingBrand ? (isBg ? "Създаване..." : "Creating...") : (isBg ? "Създай" : "Create")}</button>
              <button type="button" onClick={() => { setIsCreatingBrand(false); setNewBrandName(""); setBrandCreateError(""); }} disabled={creatingBrand} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">{isBg ? "Отказ" : "Cancel"}</button>
            </div>
            {brandCreateError && <p className="mt-2 text-sm text-red-600">{brandCreateError}</p>}
            <p className="mt-2 text-xs text-slate-500">{isBg ? "Новата марка се записва веднага и се избира за текущия продукт." : "The new brand is saved immediately and selected for the current product."}</p>
          </div>
        )}
      </div>
    </div>,
    target.mount
  );
};

export default ProductBrandEnhancer;
