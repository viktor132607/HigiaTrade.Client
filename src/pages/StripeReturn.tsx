import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearCart, addItem } from '../store/slices/cartSlice';
import { useLanguageTheme } from '../i18n/LanguageThemeContext';
import { formatCurrency } from '../utils/currency';
import { STRIPE_DRAFT_KEY, STRIPE_PENDING_KEY, STRIPE_ATTEMPT_KEY, StripeReceipt, stripeReceipt, stripeCheckoutUrl } from '../utils/stripe';

export default function StripeReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const isCancelled = params.get('cancelled') === '1';
  const { language } = useLanguageTheme(); const isBg = language === 'bg';
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const [receipt, setReceipt] = useState<StripeReceipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true); const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false; let timer: ReturnType<typeof setTimeout>; let attempts = 0;
    const check = async () => {
      setBusy(true); setError('');
      try {
        if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) throw new Error(isBg ? 'Липсва валидна платежна сесия.' : 'A valid payment session is required.');
        const result = await stripeReceipt(sessionId, isBg, isCancelled);
        if (disposed) return;
        setReceipt(result);
        if (result.paymentStatus === 'Paid') {
          dispatch(clearCart());
          sessionStorage.removeItem(STRIPE_DRAFT_KEY);
          sessionStorage.removeItem(STRIPE_PENDING_KEY);
          sessionStorage.removeItem(STRIPE_ATTEMPT_KEY);
        } else if (result.paymentStatus === 'Expired') {
          sessionStorage.removeItem(STRIPE_PENDING_KEY);
          sessionStorage.removeItem(STRIPE_ATTEMPT_KEY);
          // The browser left the app for Stripe. Restore the saved cart once, not on every poll.
          try {
            const draft = JSON.parse(sessionStorage.getItem(STRIPE_DRAFT_KEY) || 'null');
            if (Array.isArray(draft?.items)) {
              dispatch(clearCart());
              draft.items.forEach((item: Parameters<typeof addItem>[0]) => dispatch(addItem(item)));
            }
          } catch { /* Account carts remain available on the server. */ }
        } else if (++attempts < 5 && !isCancelled) timer = setTimeout(check, 2500);
      } catch (e) {
        if (!disposed) setError(e instanceof Error && !(e instanceof TypeError) ? e.message : (isBg ? 'Плащането не може да бъде проверено. Опитайте отново.' : 'Unable to verify payment. Try again.'));
      } finally { if (!disposed) setBusy(false); }
    };
    void check();
    return () => { disposed = true; clearTimeout(timer); };
  }, [sessionId, isCancelled, isBg, retry, dispatch]);

  const paid = receipt?.paymentStatus === 'Paid'; const expired = receipt?.paymentStatus === 'Expired';
  return <main className="min-h-[60vh] bg-slate-50 px-4 py-12"><section className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 sm:p-10">
    <h1 className="text-2xl font-bold">{paid ? (isBg ? 'Плащането е успешно' : 'Payment successful') : expired ? (isBg ? 'Плащането е прекратено' : 'Payment cancelled or expired') : (isBg ? 'Проверка на плащането' : 'Checking payment')}</h1>
    <div role="status" aria-live="polite" className="mt-4 space-y-3 text-slate-600">
      {busy && <p>{isBg ? 'Проверяваме статуса в Stripe…' : 'Checking the status with Stripe…'}</p>}
      {paid && <p>{isBg ? 'Поръчката е платена и очаква обработка.' : 'Your order is paid and awaiting processing.'}</p>}
      {expired && <p>{isBg ? 'Няма потвърдено плащане. Количката е запазена и можете да опитате отново.' : 'No payment was confirmed. Your cart is saved and you can try again.'}</p>}
      {!busy && receipt?.paymentStatus === 'Pending' && <p>{isBg ? 'Плащането още не е потвърдено. Продължете същото плащане или проверете отново.' : 'Payment is not confirmed yet. Continue the same payment or check again.'}</p>}
      {receipt && <p className="break-all">{isBg ? 'Поръчка' : 'Order'}: {receipt.orderId}<br />{formatCurrency(receipt.total)}</p>}
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-3">
      {(!paid && !expired) && <button disabled={busy} onClick={() => setRetry(v => v + 1)} className="min-h-12 rounded-xl border px-4 disabled:opacity-50">{isBg ? 'Провери отново' : 'Check again'}</button>}
      {receipt?.paymentStatus === 'Pending' && receipt.url && <button onClick={() => { window.location.assign(stripeCheckoutUrl(receipt.url!)); }} className="min-h-12 rounded-xl bg-teal-600 px-4 text-white">{isBg ? 'Продължи в Stripe' : 'Continue in Stripe'}</button>}
      {expired && <Link to="/checkout" className="inline-flex min-h-12 items-center rounded-xl bg-teal-600 px-4 text-white">{isBg ? 'Опитай отново' : 'Try again'}</Link>}
      {paid && token && <Link to="/orders" className="inline-flex min-h-12 items-center rounded-xl border px-4">{isBg ? 'Моите поръчки' : 'My orders'}</Link>}
      <Link to="/products" className="inline-flex min-h-12 items-center rounded-xl border px-4">{isBg ? 'Към магазина' : 'Back to shop'}</Link>
    </div>
  </section></main>;
}
