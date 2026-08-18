import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { RootState } from "../store";
import { formatCurrency } from "../utils/currency";

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

const paymentOptions = [
  { value: "online-card", label: "Card payment", description: "Pay online when you place the order." },
  { value: "bank-transfer", label: "Bank transfer", description: "Receive bank details after checkout confirmation." },
];

const deliveryOptions = [
  { value: "standard-courier", label: "Standard courier", description: "2 to 4 business days" },
  { value: "express-courier", label: "Express courier", description: "Next business day for in-stock items" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    names: "",
    postalCode: "",
    country: "Bulgaria",
    city: "",
    address: "",
    phone: "",
    paymentMethod: "online-card",
    deliveryMethod: "standard-courier",
    consentAccepted: false,
  });

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartResponse, profileResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!cartResponse.ok) {
          throw new Error("No active cart found.");
        }

        const cartData = (await cartResponse.json()) as CartResponse;
        setCart(cartData);

        if (profileResponse.ok) {
          const profileData = (await profileResponse.json()) as ProfileResponse;
          setFormData((previous) => ({
            ...previous,
            names: profileData.names ?? previous.names,
            phone: profileData.phone ?? previous.phone,
          }));
        }
      } catch (requestError) {
        console.error(requestError);
        setError("We could not load your checkout details. Review your cart and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCheckoutData();
  }, [token]);

  const selectedPayment = useMemo(
    () => paymentOptions.find((option) => option.value === formData.paymentMethod) ?? paymentOptions[0],
    [formData.paymentMethod]
  );

  const selectedDelivery = useMemo(
    () => deliveryOptions.find((option) => option.value === formData.deliveryMethod) ?? deliveryOptions[0],
    [formData.deliveryMethod]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!cart || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!formData.consentAccepted) {
      setError("You need to accept the privacy notice before placing the order.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "We could not place the order.");
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
      setError(requestError instanceof Error ? requestError.message : "We could not place the order.");
    } finally {
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

  return (
    <div className="bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Checkout</p>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950">Shipping and payment</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Confirm your delivery details, choose a payment method, and place the order for the items currently reserved in your cart.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { key: "names", label: "Full name", type: "text" },
                { key: "phone", label: "Phone", type: "tel" },
                { key: "postalCode", label: "Postal code", type: "text" },
                { key: "city", label: "City", type: "text" },
                { key: "country", label: "Country", type: "text" },
                { key: "address", label: "Address", type: "text", full: true },
              ].map((field) => (
                <div key={field.key} className={field.full ? "sm:col-span-2" : ""}>
                  <label htmlFor={field.key} className="block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    type={field.type}
                    required
                    value={formData[field.key as keyof typeof formData] as string}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Payment method</p>
                {paymentOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-primary-300">
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
                      className="mt-1 h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Delivery method</p>
                {deliveryOptions.map((option) => (
                  <label key={option.value} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-primary-300">
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
                      className="mt-1 h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                      <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formData.consentAccepted}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    consentAccepted: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                I consent to the processing of my personal data for delivery, payment, and order status communication.
              </span>
            </label>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>
          </form>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Order summary</p>
              <div className="mt-6 space-y-4">
                {cart?.items.map((item) => (
                  <div key={item.productId} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950 px-4 py-4 text-white">
                <p className="text-sm text-slate-300">Total</p>
                <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(cart?.orderTotalPrice)}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Selected flow</p>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{selectedPayment.label}</p>
                  <p className="mt-1">{selectedPayment.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{selectedDelivery.label}</p>
                  <p className="mt-1">{selectedDelivery.description}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
