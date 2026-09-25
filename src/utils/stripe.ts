import { ensureResponse } from './checkout';

export interface StripeReceipt { sessionId: string; url: string | null; orderId: string; paymentStatus: 'Pending' | 'Paid' | 'Expired'; total: number; currency: string; }
export const STRIPE_DRAFT_KEY = 'higiatrade:stripe-draft';
export const STRIPE_PENDING_KEY = 'higiatrade:stripe-pending';
export const STRIPE_ATTEMPT_KEY = 'higiatrade:stripe-attempt';

export function stripeCheckoutUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid Stripe Checkout URL.');
  return url.href;
}
export function checkoutAttempt(payload: unknown) {
  const fingerprint = JSON.stringify(payload);
  try {
    const previous = JSON.parse(sessionStorage.getItem(STRIPE_ATTEMPT_KEY) || 'null');
    if (previous?.fingerprint === fingerprint && typeof previous?.id === 'string') return previous.id as string;
  } catch { /* Start a fresh attempt if storage is damaged. */ }
  const id = crypto.randomUUID();
  sessionStorage.setItem(STRIPE_ATTEMPT_KEY, JSON.stringify({ id, fingerprint }));
  return id;
}
export async function stripeReceipt(sessionId: string, isBg: boolean, cancel = false): Promise<StripeReceipt> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/${cancel ? 'cancel' : `status?sessionId=${encodeURIComponent(sessionId)}`}`, cancel ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }),
  } : { cache: 'no-store' });
  await ensureResponse(response, isBg);
  return response.json();
}
