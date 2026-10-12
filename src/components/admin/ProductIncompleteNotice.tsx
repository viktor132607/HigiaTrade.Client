import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { noticeKeyForAdmin, shouldDisplayAdminNotice } from "../../utils/adminNoticeCooldown";

type IncompleteProduct = { id: string; title: string };
const MARKER = "[INVOICE_IMPORT_INCOMPLETE]";

const collect = (value: unknown): IncompleteProduct[] => {
  if (Array.isArray(value)) return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const description = String(o.description ?? o.Description ?? "");
    if (!description.includes(MARKER)) return [];
    const id = String(o.id ?? o.Id ?? "");
    const title = String(o.title ?? o.Title ?? "").trim();
    return id && title ? [{ id, title }] : [];
  });
  if (!value || typeof value !== "object") return [];
  const o = value as Record<string, unknown>;
  for (const key of ["items", "Items", "products", "Products", "data", "Data", "result", "Result"]) {
    const found = collect(o[key]);
    if (found.length) return found;
  }
  return [];
};

const ProductIncompleteNotice = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [items, setItems] = useState<IncompleteProduct[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [eligibleThisVisit, setEligibleThisVisit] = useState(false);
  const recordedThisVisit = useRef(false);
  const adminId = user?.id ?? "admin";

  // This component is mounted once per visit to the admin panel. Do not
  // auto-show again while navigating between admin pages, even after an hour.
  useEffect(() => {
    setItems([]);
    setDismissed(false);
    recordedThisVisit.current = false;
    try {
      const lastSeen = window.localStorage.getItem(noticeKeyForAdmin(adminId));
      setEligibleThisVisit(shouldDisplayAdminNotice(lastSeen, Date.now()));
    } catch {
      // Private browsing may disable storage; the notice still works.
      setEligibleThisVisit(true);
    }
  }, [adminId]);

  useEffect(() => {
    if (!eligibleThisVisit || !token) return;

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=200&IncludeInactive=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok || cancelled) return;
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        const incomplete = collect(payload);
        if (!incomplete.length || recordedThisVisit.current) return;
        recordedThisVisit.current = true;

        // Start the one-hour cooldown when the notice becomes visible, not
        // when the administrator closes it. It never auto-reopens this visit.
        setItems(incomplete);
        try {
          window.localStorage.setItem(noticeKeyForAdmin(adminId), String(Date.now()));
        } catch { /* Storage might be unavailable. */ }
      } catch { /* Do not interrupt the admin panel on API errors. */ }
    };
    void load();
    return () => { cancelled = true; };
  }, [token, adminId, eligibleThisVisit]);

  if (!items.length || dismissed) return null;

  return (
    <div role="status" className="relative mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 pr-12 text-amber-950">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={isBg ? "Затвори предупреждението" : "Dismiss notification"}
        title={isBg ? "Затвори" : "Close"}
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-900 transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      <div className="font-black">
        {isBg ? `${items.length} продукта от фактури чакат допълване` : `${items.length} invoice products need completion`}
      </div>
      <div className="mt-1 text-sm font-semibold">
        {items.slice(0, 8).map((item) => item.title).join(" · ")}
        {items.length > 8 ? ` · +${items.length - 8}` : ""}
      </div>
    </div>
  );
};

export default ProductIncompleteNotice;
