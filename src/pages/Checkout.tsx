import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { RootState } from "../store";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface CartItem {
  productId: string;
  quantity: number;
  totalPrice: number;
  title: string;
}

interface CartResponse {
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
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    names: "",
    postalCode: "",
    country: isBg ? "България" : "Bulgaria",
    city: "",
    address: "",
    phone: "",
    paymentMethod: "online-card",
    deliveryMethod: "standard-courier",
    consentAccepted: false,
  });

  const paymentOptions = useMemo(() => [
    { value: "online-card", label: isBg ? "Плащане с карта" : "Card payment", description: isBg ? "Плащане онлайн при завършване на поръчката." : "Pay online when you place the order." },
    { value: "bank-transfer", label: isBg ? "Банков превод" : "Bank transfer", description: isBg ? "Ще получиш банковите данни след потвърждение на поръчката." : "Receive bank details after checkout confirmation." },
  ], [isBg]);

  const deliveryOptions = useMemo(() => [
    { value: "standard-courier", label: isBg ? "Стандартна доставка" : "Standard courier", description: isBg ? "2 до 4 работни дни" : "2 to 4 business days" },
    { value: "express-courier", label: isBg ? "Експресна доставка" : "Express courier", description: isBg ? "Следващ работен ден за налични артикули" : "Next business day for in-stock items" },
  ], [isBg]);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartResponse, profileResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!cartResponse.ok) throw new Error(isBg ? "Няма активна количка." : "No active cart found.");
        setCart(await cartResponse.json());
        if (profileResponse.ok) {
          const profileData = (await profileResponse.json()) as ProfileResponse;
          setFormData((previous) => ({ ...previous, names: profileData.names ?? previous.names, phone: profileData.phone ?? previous.phone }));
        }
      } catch (requestError) {
        console.error(requestError);
        setError(isBg ? "Данните за поръчката не можаха да бъдат заредени. Провери количката и опитай отново." : "We could not load your checkout details. Review your cart and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchCheckoutData();
  }, [token]);

  const selectedPayment = useMemo(() => paymentOptions.find((option) => option.value === formData.paymentMethod) ?? paymentOptions[0], [formData.paymentMethod, paymentOptions]);
  const selectedDelivery = useMemo(() => deliveryOptions.find((option) => option.value === formData.deliveryMethod) ?? deliveryOptions[0], [formData.deliveryMethod, deliveryOptions]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!cart || cart.items.length === 0) {
      setError(isBg ? "Количката е празна." : "Your cart is empty.");
      return;
    }
    if (!formData.consentAccepted) {
      setError(isBg ? "Трябва да приемеш известието за лични данни преди поръчка." : "You need to accept the privacy notice before placing the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || (isBg ? "Поръчката не можа да бъде създадена." : "We could not place the order."));
      }
      navigate("/checkout/confirmation", {
        state: {
          names: formData.names,
          city: formData.city,
          address: formData.address,
          paymentMethodLabel: selectedPayment.label,
          deliveryMethodLabel: selectedDelivery.label,
        },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : isBg ? "Поръчката не можа да бъде създадена." : "We could not place the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50"><div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" /></div>;

  const fieldDefinitions = [
    { key: "names", bg: "Име и фамилия", en: "Full name", type: "text" },
    { key: "phone", bg: "Телефон", en: "Phone", type: "tel" },
    { key: "postalCode", bg: "Пощенски код", en: "Postal code", type: "text" },
    { key: "city", bg: "Град", en: "City", type: "text" },
    { key: "country", bg: "Държава", en: "Country", type: "text" },
    { key: "address", bg: "Адрес", en: "Address", type: "text", full: true },
  ];

  return (
    <div className="bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary-300 hover:text-primary-700"><ArrowLeftIcon className="h-4 w-4" />{isBg ? "Назад" : "Back"}</button>

        <div className="mt-5 grid gap-5 lg:mt-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] sm:space-y-6 sm:rounded-[2rem] sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">{isBg ? "Завършване на поръчката" : "Checkout"}</p>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{isBg ? "Доставка и плащане" : "Shipping and payment"}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Потвърди данните за доставка, избери начин на плащане и завърши поръчката." : "Confirm your delivery details, choose a payment method, and place the order for the items currently reserved in your cart."}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {fieldDefinitions.map((field) => (
                <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
                  <label htmlFor={field.key} className="block text-sm font-medium text-slate-700">{isBg ? field.bg : field.en}</label>
                  <input id={field.key} type={field.type} required value={formData[field.key as keyof typeof formData] as string} onChange={(event) => setFormData((previous) => ({ ...previous, [field.key]: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Начин на плащане" : "Payment method"}</p>
                {paymentOptions.map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-primary-300"><input type="radio" name="paymentMethod" value={option.value} checked={formData.paymentMethod === option.value} onChange={(event) => setFormData((previous) => ({ ...previous, paymentMethod: event.target.value }))} className="mt-1 h-4 w-4 flex-none border-slate-300 text-primary-600" /><span><span className="block text-sm font-semibold text-slate-900">{option.label}</span><span className="mt-1 block text-sm text-slate-500">{option.description}</span></span></label>)}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{isBg ? "Начин на доставка" : "Delivery method"}</p>
                {deliveryOptions.map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-primary-300"><input type="radio" name="deliveryMethod" value={option.value} checked={formData.deliveryMethod === option.value} onChange={(event) => setFormData((previous) => ({ ...previous, deliveryMethod: event.target.value }))} className="mt-1 h-4 w-4 flex-none border-slate-300 text-primary-600" /><span><span className="block text-sm font-semibold text-slate-900">{option.label}</span><span className="mt-1 block text-sm text-slate-500">{option.description}</span></span></label>)}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><input type="checkbox" checked={formData.consentAccepted} onChange={(event) => setFormData((previous) => ({ ...previous, consentAccepted: event.target.checked }))} className="mt-1 h-4 w-4 flex-none rounded border-slate-300 text-primary-600" /><span>{isBg ? "Съгласявам се личните ми данни да бъдат използвани за доставка, плащане и комуникация за статуса на поръчката." : "I consent to the processing of my personal data for delivery, payment, and order status communication."}</span></label>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-70">{isSubmitting ? (isBg ? "Изпращане..." : "Placing order...") : (isBg ? "Завърши поръчката" : "Place order")}</button>
          </form>

          <aside className="space-y-5 sm:space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">{isBg ? "Обобщение" : "Order summary"}</p>
              <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">{cart?.items.map((item) => <div key={item.productId} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 sm:px-4"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{isBg ? "Количество" : "Quantity"}: {item.quantity}</p></div><p className="shrink-0 text-sm font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</p></div>)}</div>
              <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4 text-white sm:mt-6"><p className="text-sm text-slate-300">{isBg ? "Общо" : "Total"}</p><p className="mt-2 font-display text-2xl font-bold sm:text-3xl">{formatCurrency(cart?.orderTotalPrice)}</p></div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">{isBg ? "Избран начин" : "Selected flow"}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600 sm:space-y-4">{[selectedPayment, selectedDelivery].map((option) => <div key={option.value} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="font-semibold text-slate-900">{option.label}</p><p className="mt-1">{option.description}</p></div>)}</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
