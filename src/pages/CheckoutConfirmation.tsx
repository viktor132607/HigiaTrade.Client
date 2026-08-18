import { CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Link, Navigate, useLocation } from "react-router-dom";

interface ConfirmationState {
  names: string;
  city: string;
  address: string;
  paymentMethodLabel: string;
  deliveryMethodLabel: string;
}

const CheckoutConfirmation = () => {
  const location = useLocation();
  const state = location.state as ConfirmationState | undefined;

  if (!state) {
    return <Navigate to="/checkout" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-14">
      <div className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.55)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircleIcon className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-center font-display text-4xl font-bold tracking-tight text-slate-950">
          Order received
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-slate-600">
          Your order has been placed successfully. We&apos;ll confirm stock, prepare shipment, and keep you updated as the status changes.
        </p>

        <div className="mt-10 grid gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Customer</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{state.names}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Delivery</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{state.deliveryMethodLabel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Shipping address</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{state.city}, {state.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Payment</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{state.paymentMethodLabel}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            View orders
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/products"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmation;
