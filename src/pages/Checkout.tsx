import { checkoutAttempt, stripeCheckoutUrl, STRIPE_DRAFT_KEY, STRIPE_PENDING_KEY, STRIPE_ATTEMPT_KEY } from "../utils/stripe";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { DELIVERY_REGIONS, MINIMUM_ORDER, minimumOrderMessage, ensureResponse, refreshCheckoutItems, checkoutErrorMessage } from "../utils/checkout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { RootState } from "../store";
import { clearCart, addItem } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface CartItem {
  productId: string;
  quantity: number;
  totalPrice: number;
  singlePrice?: number;
  title: string;
  primaryImageUri?: string;
}

interface CartResponse {
  id?: string;
  orderTotalPrice: number;
  items: CartItem[];
}

interface ProfileResponse {
  email: string;
  names: string;
  phone: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const localItems = useSelector((state: RootState) => state.cart.items);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const restoredDraft = useRef(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveringPayment, setRecoveringPayment] = useState(true);
  const [recoveryRetry, setRecoveryRetry] = useState(0);
  const [stripe, setStripe] = useState({ enabled: false, testMode: true });
  const [pendingSession, setPendingSession] = useState<string | null>(() => {
    try { return sessionStorage.getItem(STRIPE_PENDING_KEY); } catch { return null; }
  });
  useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/config`)
      .then(response => response.ok ? response.json() : null)
      .then(config => { if (!cancelled && config) setStripe(config); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const recover = async () => {
      setRecoveringPayment(true); setRecoveryError("");
      try {
        if (!restoredDraft.current && localItems.length === 0) {
          restoredDraft.current = true;
          const draft = JSON.parse(sessionStorage.getItem(STRIPE_DRAFT_KEY) || "null");
          if (Array.isArray(draft?.items) && draft.savedAt > Date.now() - 86400000) draft.items.forEach((item: Parameters<typeof addItem>[0]) => dispatch(addItem(item)));
        }
        const attempt = JSON.parse(sessionStorage.getItem(STRIPE_ATTEMPT_KEY) || "null");
        if (!attempt?.id) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/attempt?attemptId=${encodeURIComponent(attempt.id)}`);
        if (response.status === 404) return;
        await ensureResponse(response, isBg);
        const receipt = await response.json();
        if (cancelled) return;
        if (receipt.paymentStatus === "Expired") { sessionStorage.removeItem(STRIPE_ATTEMPT_KEY); sessionStorage.removeItem(STRIPE_PENDING_KEY); setPendingSession(null); }
        else if (receipt.sessionId) { sessionStorage.setItem(STRIPE_PENDING_KEY, receipt.sessionId); setPendingSession(receipt.sessionId); }
      } catch { if (!cancelled) setRecoveryError(isBg ? "Не успяхме да проверим предишното плащане. Проверете отново преди нова поръчка." : "We could not verify the previous payment. Check again before placing another order."); }
      finally { if (!cancelled) setRecoveringPayment(false); }
    };
    void recover();
    return () => { cancelled = true; };
  }, [dispatch, isBg, recoveryRetry]);
  const submitting = useRef(false);
  const [cartReady, setCartReady] = useState(false);
  const [reload, setReload] = useState(0);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => {
    const defaults = {
    names: "",
    email: "",
    postalCode: "",
    country: "България",
    deliveryRegion: "",
    invoiceRequested: false,
    invoiceCompanyName: "",
    invoiceCompanyId: "",
    invoiceVatId: "",
    invoiceAddress: "",
    city: "",
    address: "",
    phone: "",
    paymentMethod: "cash-on-delivery",
    deliveryMethod: "regional-delivery",
    consentAccepted: false,
    };
    try {
      const draft = JSON.parse(sessionStorage.getItem(STRIPE_DRAFT_KEY) || 'null');
      if (draft?.form && draft.savedAt > Date.now() - 86400000) return { ...defaults, ...draft.form, consentAccepted: false } as typeof defaults;
    } catch { /* Start a fresh form when storage is unavailable. */ }
    return defaults;
  });

  const localCart = useMemo<CartResponse>(() => {
    const items: CartItem[] = localItems.map((item) => {
      const unitPrice =
        item.discountedPrice && item.discountedPrice > 0
          ? item.discountedPrice
          : item.regularPrice;

      return {
        productId: item.id,
        quantity: item.quantity,
        title: item.title,
        singlePrice: unitPrice,
        totalPrice: unitPrice * item.quantity,
        primaryImageUri:
          item.mainImageUrl || item.imageUrl || "/higiqlogo.png",
      };
    });

    return {
      id: "local",
      items,
      orderTotalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0),
    };
  }, [localItems]);

  const paymentOptions = useMemo(
    () => [
      ...(stripe.enabled ? [{ value: "online-card", label: isBg ? "Карта чрез Stripe" : "Card via Stripe", description: stripe.testMode ? (isBg ? "Тестово плащане — без реално таксуване." : "Test payment — no real charge.") : (isBg ? "Сигурно плащане в Stripe." : "Secure payment in Stripe.") }] : []),
      {
        value: "cash-on-delivery",
        label: isBg ? "В брой при доставка" : "Cash on delivery",
        description: isBg
          ? "Заплащате при получаване на поръчката."
          : "Pay when you receive your order.",
      },
      {
        value: "bank-transfer",
        label: isBg ? "Банков превод" : "Bank transfer",
        description: isBg
          ? "Ще получиш банковите данни след потвърждение на поръчката."
          : "Receive bank details after checkout confirmation.",
      },
    ],
    [isBg, stripe.enabled, stripe.testMode]
  );

  const deliveryOptions = useMemo(
    () => [
      {
        value: "regional-delivery",
        label: isBg ? "Доставка в обслужвания район" : "Regional delivery",
        description: isBg ? "Срокът и цената за доставка се уточняват при потвърждение. Не са включени в сумата на продуктите." : "Delivery timing and cost are agreed during confirmation and are not included in the product total.",
      },
    ],
    [isBg]
  );

  useEffect(() => {
    let cancelled = false;

    const authHeaders = token
      ? { Authorization: `Bearer ${token}` }
      : undefined;

    const enrichServerCart = (serverCart: CartResponse): CartResponse => {
      const localById = new Map(localItems.map((item) => [item.id, item]));
      const items = Array.isArray(serverCart.items)
        ? serverCart.items.map((item) => {
            const localItem = localById.get(item.productId);
            const quantity = Math.max(1, Number(item.quantity) || 1);
            const totalPrice = Number(item.totalPrice) || 0;
            return {
              ...item,
              quantity,
              totalPrice,
              singlePrice:
                Number(item.singlePrice) ||
                (totalPrice > 0 ? totalPrice / quantity : 0),
              title: item.title || localItem?.title || (isBg ? "Продукт" : "Product"),
              primaryImageUri:
                item.primaryImageUri ||
                localItem?.mainImageUrl ||
                localItem?.imageUrl ||
                "/higiqlogo.png",
            };
          })
        : [];

      return {
        ...serverCart,
        items,
        orderTotalPrice:
          Number(serverCart.orderTotalPrice) ||
          items.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    };

    const fetchServerCart = async (): Promise<CartResponse | null> => {
      if (!token) return null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
        headers: authHeaders,
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        await ensureResponse(response, isBg);
      }

      return (await response.json()) as CartResponse;
    };

    const syncMissingLocalItems = async (
      currentServerCart: CartResponse | null
    ): Promise<CartResponse | null> => {
      if (!token || localItems.length === 0) return currentServerCart;

      const serverQuantityByProduct = new Map(
        (currentServerCart?.items ?? []).map((item) => [
          item.productId,
          Number(item.quantity) || 0,
        ])
      );

      let changed = false;
      for (const item of localItems) {
        const serverQuantity = serverQuantityByProduct.get(item.id) ?? 0;
        const missingQuantity = Math.max(0, item.quantity - serverQuantity);
        if (missingQuantity === 0) continue;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.id,
            quantity: missingQuantity,
          }),
        });

        if (!response.ok) {
          await ensureResponse(response, isBg);
        }
        changed = true;
      }

      return changed ? await fetchServerCart() : currentServerCart;
    };

    const loadProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/me`, {
          headers: authHeaders,
        });
        if (!response.ok) return;
        const profile = (await response.json()) as ProfileResponse;
        if (!cancelled) {
          setFormData((previous) => ({
            ...previous,
            names: profile.names ?? previous.names,
            email: profile.email ?? previous.email,
            phone: profile.phone ?? previous.phone,
          }));
        }
      } catch {
        // Profile data is optional for checkout; the customer can fill the form manually.
      }
    };

    const loadCheckout = async () => {
      setIsLoading(true);
      setCartReady(false);
      setError(null);

      void loadProfile();

      try {
        let serverCart = await fetchServerCart();
        serverCart = await syncMissingLocalItems(serverCart);

        if (cancelled) return;

        if (!token) {
          const items = await refreshCheckoutItems(localCart.items, isBg);
          if (cancelled) return;
          setCart({ ...localCart, items, orderTotalPrice: items.reduce((sum, item) => sum + item.totalPrice, 0) });
        } else if (serverCart?.items?.length) {
          setCart(enrichServerCart(serverCart));
        } else if (localCart.items.length > 0) {
          setCart(localCart);
        } else {
          setCart({ items: [], orderTotalPrice: 0 });
        }
        setCartReady(true);
      } catch (checkoutError) {
        if (cancelled) return;

        // Never hide products already present in the browser cart just because
        // the server cart could not be read. They remain visible while the
        // server issue blocks submission until the cart can be checked again.
        if (localCart.items.length > 0) {
          setCart(localCart);
        } else {
          setCart({ items: [], orderTotalPrice: 0 });
          setError(
            isBg
              ? "Данните за поръчката не можаха да бъдат заредени."
              : "We could not load your checkout details."
          );
        }
        setError(checkoutError instanceof Error && !(checkoutError instanceof TypeError) ? checkoutError.message : checkoutErrorMessage("", 500, isBg));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadCheckout();
    return () => {
      cancelled = true;
    };
  }, [token, localCart, localItems, isBg, reload]);

  const selectedPayment =
    paymentOptions.find((option) => option.value === formData.paymentMethod) ??
    paymentOptions[0];
  const selectedDelivery =
    deliveryOptions.find((option) => option.value === formData.deliveryMethod) ??
    deliveryOptions[0];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingSession) { navigate(`/checkout/stripe?session_id=${encodeURIComponent(pendingSession)}`); return; }
    if (submitting.current || !cartReady || recoveringPayment || recoveryError) return;
    setError(null);

    if (!cart || cart.items.length === 0) {
      setError(isBg ? "Количката е празна." : "Your cart is empty.");
      return;
    }
    if (cart.orderTotalPrice < MINIMUM_ORDER) {
      setError(minimumOrderMessage(cart.orderTotalPrice, isBg)); return;
    }
    if (!DELIVERY_REGIONS.some(region => region.bg === formData.deliveryRegion)) {
      setError(isBg ? "Изберете обслужван район." : "Select a delivery region."); return;
    }
    if (!formData.consentAccepted) {
      setError(
        isBg
          ? "Трябва да приемеш известието за лични данни."
          : "You need to accept the privacy notice."
      );
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    try {
      const items = await refreshCheckoutItems(cart.items, isBg);
      const total = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
      if (items.some((item, index) => Math.abs(item.totalPrice - cart.items[index].totalPrice) > 0.009)) {
        setCart({ ...cart, items, orderTotalPrice: total });
        setError(isBg ? "Цените са обновени. Прегледайте новата сума и потвърдете отново." : "Prices have changed. Review the updated total and confirm again.");
        return;
      }
      if (total < MINIMUM_ORDER) { setError(minimumOrderMessage(total, isBg)); return; }
      if (formData.paymentMethod === "online-card") {
        if (!stripe.enabled) throw new Error(isBg ? "Плащането с карта не е налично." : "Card payment is unavailable.");
        const payload = { ...formData, expectedTotal: total, items: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity })) };
        const checkoutAttemptId = checkoutAttempt(payload);
        const savedItems = cart.items.map(item => ({ id: item.productId, title: item.title, quantity: item.quantity, regularPrice: item.singlePrice || item.totalPrice / item.quantity, imageUrl: item.primaryImageUri || "", mainImageUrl: item.primaryImageUri }));
        sessionStorage.setItem(STRIPE_DRAFT_KEY, JSON.stringify({ form: formData, items: savedItems, savedAt: Date.now() }));
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/checkout`, {
          method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ ...payload, checkoutAttemptId }),
        });
        await ensureResponse(response, isBg);
        const receipt = await response.json();
        sessionStorage.setItem(STRIPE_PENDING_KEY, receipt.sessionId);
        setPendingSession(receipt.sessionId);
        if (receipt.url) window.location.assign(stripeCheckoutUrl(receipt.url));
        else navigate(`/checkout/stripe?session_id=${encodeURIComponent(receipt.sessionId)}`);
        return;
      }
      const guest = !token;
      const url = guest
        ? `${process.env.NEXT_PUBLIC_API_URL}/Orders/guest`
        : `${process.env.NEXT_PUBLIC_API_URL}/Orders`;
      const payload = guest
        ? {
            ...formData,
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }
        : formData;

      const response = await fetch(url, {
        method: "POST",
        headers: guest
          ? { "Content-Type": "application/json" }
          : {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
        body: JSON.stringify(payload),
      });

      await ensureResponse(response, isBg);
      const receipt = await response.json().catch(() => null);
      dispatch(clearCart());
      sessionStorage.removeItem(STRIPE_DRAFT_KEY);
      sessionStorage.removeItem(STRIPE_ATTEMPT_KEY);
      navigate("/checkout/confirmation", {
        state: {
          names: formData.names,
          city: formData.city,
          address: formData.address,
          paymentMethodLabel: selectedPayment.label,
          deliveryMethodLabel: selectedDelivery.label,
          guest,
          invoiceRequested: formData.invoiceRequested,
          orderId: receipt?.orderId || (cart.id !== "local" ? cart.id : undefined),
          paymentMethod: formData.paymentMethod,
          total: cart.orderTotalPrice,
        },
      });
    } catch (submitError) {
      if (formData.paymentMethod === "online-card") setRecoveryRetry(v => v + 1);
      setError(
        submitError instanceof Error && !(submitError instanceof TypeError)
          ? submitError.message
          : isBg
            ? "Поръчката не можа да бъде създадена."
            : "We could not place the order."
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  const fields = [
    { key: "names", bg: "Име и фамилия", en: "Full name", type: "text" },
    { key: "email", bg: "Имейл", en: "Email", type: "email" },
    { key: "phone", bg: "Телефон", en: "Phone", type: "tel" },
    { key: "postalCode", bg: "Пощенски код", en: "Postal code", type: "text" },
    { key: "city", bg: "Населено място", en: "Town / village", type: "text" },
    { key: "country", bg: "Държава", en: "Country", type: "text" },
    { key: "address", bg: "Адрес", en: "Address", type: "text", full: true },
  ];

  return (
    <div className="bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-4 py-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {isBg ? "Назад" : "Back"}
        </button>

        {recoveryError && <div role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-800">{recoveryError} <button type="button" className="underline" onClick={() => setRecoveryRetry(v => v + 1)}>{isBg ? "Провери отново" : "Check again"}</button></div>}
        {pendingSession && <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p>{isBg ? "Имате започнато плащане. Проверете го преди нова поръчка." : "You have a payment in progress. Check it before placing another order."}</p>
          <Link className="mt-2 inline-block underline" to={`/checkout/stripe?session_id=${encodeURIComponent(pendingSession)}`}>{isBg ? "Провери / продължи плащането" : "Check / resume payment"}</Link>
          <Link className="ml-4 underline" to={`/checkout/stripe?cancelled=1&session_id=${encodeURIComponent(pendingSession)}`}>{isBg ? "Прекрати плащането" : "Cancel payment"}</Link>
        </div>}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-[2rem] border bg-white p-6 sm:p-8"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">
                {token
                  ? isBg
                    ? "Завършване на поръчката"
                    : "Checkout"
                  : isBg
                    ? "Поръчка като гост"
                    : "Guest checkout"}
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                {isBg ? "Доставка и плащане" : "Shipping and payment"}
              </h1>
              {!token && (
                <p className="mt-2 text-sm text-slate-500">
                  {isBg
                    ? "Не е нужна регистрация. Въведи данните за доставка и завърши поръчката."
                    : "No registration required. Enter your delivery details and place the order."}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
              {isBg ? "Доставяме в районите на Русе, Силистра, Разград, Свищов, Бяла и Търговище. За адрес извън тях се свържете с нас преди поръчка." : "We deliver in the areas of Ruse, Silistra, Razgrad, Svishtov, Byala and Targovishte. Contact us before ordering outside these areas."}
              <Link to="/contact" className="ml-2 underline">{isBg ? "Контакти" : "Contact"}</Link>
            </div>
            <label className="block text-sm font-medium" htmlFor="deliveryRegion">{isBg ? "Район за доставка" : "Delivery area"}</label>
            <select id="deliveryRegion" required value={formData.deliveryRegion} onChange={event => setFormData(previous => ({ ...previous, deliveryRegion: event.target.value }))} className="h-12 w-full rounded-2xl border bg-slate-50 px-4">
              <option value="">{isBg ? "Изберете район" : "Select an area"}</option>
              {DELIVERY_REGIONS.map(region => <option key={region.bg} value={region.bg}>{isBg ? region.bg : region.en}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
                  <label htmlFor={field.key} className="block text-sm font-medium">
                    {isBg ? field.bg : field.en}
                  </label>
                  <input
                    id={field.key}
                    type={field.type}
                    readOnly={field.key === "country"}
                    autoComplete={({ names: "name", email: "email", phone: "tel", postalCode: "postal-code", city: "address-level2", address: "street-address", country: "country-name" } as Record<string, string>)[field.key]}
                    maxLength={field.key === "address" ? 300 : field.key === "phone" ? 30 : field.key === "city" ? 100 : 120}
                    pattern={field.key === "postalCode" ? "[0-9]{4}" : field.key === "phone" ? "[+]?[0-9\\s]{7,20}" : field.key === "email" || field.key === "country" ? undefined : ".*\\S.*"}
                    required
                    value={field.key === "country" ? (isBg ? "България" : "Bulgaria") : formData[field.key as keyof typeof formData] as string}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border bg-slate-50 px-4"
                  />
                </div>
              ))}
            </div>

            <fieldset className="space-y-4 rounded-2xl border p-4">
              <legend className="px-2 font-semibold">{isBg ? "Фактура" : "Invoice"}</legend>
              <label className="flex items-center gap-3"><input type="checkbox" checked={formData.invoiceRequested} onChange={event => setFormData(previous => ({ ...previous, invoiceRequested: event.target.checked }))} />{isBg ? "Желая фактура на фирма" : "I need a company invoice"}</label>
              {formData.invoiceRequested && <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "invoiceCompanyName", bg: "Име на фирма", en: "Company name", max: 200 },
                  { key: "invoiceCompanyId", bg: "ЕИК / БУЛСТАТ", en: "Company ID (EIK / BULSTAT)", pattern: "([0-9]{9}|[0-9]{13})", max: 13 },
                  { key: "invoiceVatId", bg: "ДДС номер (незадължителен)", en: "VAT number (optional)", pattern: "BG[0-9]{9,10}", max: 12 },
                  { key: "invoiceAddress", bg: "Адрес по регистрация", en: "Registered billing address", max: 300 },
                ].map(field => <label key={field.key} className="block text-sm">{isBg ? field.bg : field.en}<input required={field.key !== "invoiceVatId"} pattern={field.pattern || ".*\\S.*"} maxLength={field.max} value={formData[field.key as keyof typeof formData] as string} onChange={event => setFormData(previous => ({ ...previous, [field.key]: field.key === "invoiceVatId" ? event.target.value.toUpperCase() : event.target.value }))} className="mt-2 h-12 w-full rounded-xl border bg-slate-50 px-3" /></label>)}
              </div>}
            </fieldset>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase text-slate-500">
                  {isBg ? "Начин на плащане" : "Payment method"}
                </p>
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex gap-3 rounded-2xl border bg-slate-50 p-4"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={formData.paymentMethod === option.value}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          paymentMethod: event.target.value,
                        }))
                      }
                    />
                    <span>
                      <b>{option.label}</b>
                      <span className="mt-1 block text-sm text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase text-slate-500">
                  {isBg ? "Начин на доставка" : "Delivery method"}
                </p>
                {deliveryOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex gap-3 rounded-2xl border bg-slate-50 p-4"
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={option.value}
                      checked={formData.deliveryMethod === option.value}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          deliveryMethod: event.target.value,
                        }))
                      }
                    />
                    <span>
                      <b>{option.label}</b>
                      <span className="mt-1 block text-sm text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex gap-3 rounded-2xl border bg-slate-50 p-4 text-sm">
              <input
                type="checkbox"
                checked={formData.consentAccepted}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    consentAccepted: event.target.checked,
                  }))
                }
              />
              <span>
                {isBg
                  ? "Съгласявам се личните ми данни да бъдат използвани за обработка и доставка на поръчката."
                  : "I consent to the use of my personal data for processing and delivery of the order."}
              </span>
            </label>

            {error && (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {!cartReady && <button type="button" onClick={() => setReload(value => value + 1)} className="min-h-11 underline">{isBg ? "Провери количката отново" : "Check cart again"}</button>}
            {cart && cart.orderTotalPrice < MINIMUM_ORDER && <p role="status" className="rounded-xl bg-amber-50 p-4 text-amber-900">{minimumOrderMessage(cart.orderTotalPrice, isBg)} <Link to="/products" className="underline">{isBg ? "Добави продукти" : "Add products"}</Link></p>}
            <button
              disabled={isSubmitting || recoveringPayment || Boolean(recoveryError) || Boolean(pendingSession) || !cartReady || !cart?.items.length || cart.orderTotalPrice < MINIMUM_ORDER}
              className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting
                ? isBg
                  ? formData.paymentMethod === "online-card" ? "Пренасочване към Stripe..." : "Изпращане..."
                  : formData.paymentMethod === "online-card" ? "Opening Stripe..." : "Placing order..."
                : isBg
                  ? "Завърши поръчката"
                  : "Place order"}
            </button>
          </form>

          <aside className="h-fit rounded-[2rem] border bg-white p-6 lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase text-primary-600">
              {isBg ? "Обобщение" : "Order summary"}
            </p>

            <div className="mt-5 space-y-3">
              {cart?.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <img
                    src={item.primaryImageUri || "/higiqlogo.png"}
                    alt={item.title}
                    className="h-20 w-20 shrink-0 rounded-xl bg-white object-contain"
                    onError={(event) => {
                      if (!event.currentTarget.src.endsWith("/higiqlogo.png")) {
                        event.currentTarget.src = "/higiqlogo.png";
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 font-semibold leading-5">
                        {item.title}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {isBg ? "Количество" : "Quantity"}: {item.quantity}
                    </p>
                    {Number(item.singlePrice) > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatCurrency(item.singlePrice)} × {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {!cart?.items.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  {isBg ? "Няма продукти в количката." : "There are no products in your cart."}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-sm text-slate-300">{isBg ? "Продукти с ДДС, без доставка" : "Products including VAT, excluding delivery"}</p>
              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(cart?.orderTotalPrice ?? 0)}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
