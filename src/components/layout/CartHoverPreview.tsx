import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type PreviewPosition = {
  top: number;
  left: number;
};

const PANEL_WIDTH = 384;
const HIDE_DELAY_MS = 140;

const CartHoverPreview = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = useSelector((state: RootState) => state.cart.total);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PreviewPosition>({ top: 0, left: 0 });
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const updatePosition = () => {
    const target = activeTargetRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const viewportPadding = 16;
    const left = Math.max(
      viewportPadding,
      Math.min(window.innerWidth - PANEL_WIDTH - viewportPadding, rect.right - PANEL_WIDTH)
    );

    setPosition({
      top: rect.bottom + 8,
      left,
    });
  };

  const showPreview = (target: HTMLElement) => {
    if (window.innerWidth < 1280) return;
    clearHideTimer();
    activeTargetRef.current = target;
    updatePosition();
    setIsOpen(true);
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      activeTargetRef.current = null;
    }, HIDE_DELAY_MS);
  };

  useEffect(() => {
    const cartLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('header a[href="/cart"]')
    );

    const cleanups = cartLinks.map((link) => {
      const onMouseEnter = () => showPreview(link);
      const onMouseLeave = () => scheduleHide();
      const onFocus = () => showPreview(link);
      const onBlur = () => scheduleHide();

      link.addEventListener("mouseenter", onMouseEnter);
      link.addEventListener("mouseleave", onMouseLeave);
      link.addEventListener("focus", onFocus);
      link.addEventListener("blur", onBlur);

      return () => {
        link.removeEventListener("mouseenter", onMouseEnter);
        link.removeEventListener("mouseleave", onMouseLeave);
        link.removeEventListener("focus", onFocus);
        link.removeEventListener("blur", onBlur);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      clearHideTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const reposition = () => updatePosition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const visibleItems = cartItems.slice(0, 5);
  const remainingItems = Math.max(0, cartItems.length - visibleItems.length);
  const money = (value: number) =>
    new Intl.NumberFormat(isBg ? "bg-BG" : "en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return createPortal(
    <div
      className="fixed z-[100] w-96 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/15 dark:bg-slate-950 dark:text-white"
      style={{ top: position.top, left: position.left }}
      onMouseEnter={clearHideTimer}
      onMouseLeave={scheduleHide}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="font-semibold">{isBg ? "Количка" : "Cart"}</div>
        <div className="text-xs text-slate-500 dark:text-white/60">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {isBg ? "бр." : "items"}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-white/60">
          {isBg ? "Количката е празна." : "Your cart is empty."}
        </div>
      ) : (
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {visibleItems.map((item) => {
            const imageUrl = item.mainImageUrl || item.imageUrl;
            const unitPrice = item.discountedPrice || item.regularPrice;

            return (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                onClick={() => setIsOpen(false)}
                className="flex gap-3 rounded-lg p-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-16 w-16 flex-none rounded-md border border-slate-200 object-cover dark:border-white/10"
                  />
                ) : (
                  <div className="h-16 w-16 flex-none rounded-md border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium leading-5">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-white/60">
                    {item.quantity} × {money(unitPrice)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#18b99f]">
                    {money(unitPrice * item.quantity)}
                  </div>
                </div>
              </Link>
            );
          })}

          {remainingItems > 0 && (
            <div className="px-2 py-2 text-center text-xs text-slate-500 dark:text-white/60">
              +{remainingItems} {isBg ? "още продукта" : "more products"}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-white/60">{isBg ? "Общо" : "Total"}</span>
          <span className="text-base font-bold">{money(cartTotal)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/cart"
            onClick={() => setIsOpen(false)}
            className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-semibold transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white/20"
          >
            {isBg ? "Виж количката" : "View cart"}
          </Link>
          <Link
            to="/checkout"
            onClick={() => setIsOpen(false)}
            className="rounded-md bg-[#18b99f] px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#149f8a]"
          >
            {isBg ? "Поръчай" : "Checkout"}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CartHoverPreview;
