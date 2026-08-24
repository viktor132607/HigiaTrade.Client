import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface ConfirmationState {
  names: string;
  city: string;
  address: string;
  paymentMethodLabel: string;
  deliveryMethodLabel: string;
}

const CheckoutConfirmation = () => {
  const location = useLocation();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const state = location.state as ConfirmationState | undefined;

  if (!state) return <Navigate to="/checkout" replace />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-3 py-8 sm:px-4 sm:py-14">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 sm:h-16 sm:w-16"><CheckCircleIcon className="h-8 w-8 sm:h-9 sm:w-9" /></div>
        <h1 className="mt-5 text-center font-display text-3xl font-bold tracking-tight text-slate-950 sm:mt-6 sm:text-4xl">{isBg ? "Поръчката е приета" : "Order received"}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{isBg ? "Поръчката е създадена успешно. Ще потвърдим наличностите, ще подготвим доставката и ще те информираме при промяна на статуса." : "Your order has been placed successfully. We'll confirm stock, prepare shipment, and keep you updated as the status changes."}</p>

        <div className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:mt-10 sm:grid-cols-2 sm:rounded-[2rem] sm:p-6">
          {[
            [isBg ? "Клиент" : "Customer", state.names],
            [isBg ? "Доставка" : "Delivery", state.deliveryMethodLabel],
            [isBg ? "Адрес за доставка" : "Shipping address", `${state.city}, ${state.address}`],
            [isBg ? "Плащане" : "Payment", state.paymentMethodLabel],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:tracking-[0.24em]">{label}</p>
              <p className="mt-2 break-words text-sm font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link to="/orders" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-600">{isBg ? "Виж поръчките" : "View orders"}<ArrowRightIcon className="h-4 w-4" /></Link>
          <Link to="/products" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700">{isBg ? "Продължи пазаруването" : "Continue shopping"}</Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmation;
