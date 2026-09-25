import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkoutAttempt, stripeCheckoutUrl, stripeReceipt } from '../stripe';
afterEach(() => vi.unstubAllGlobals());
describe('Stripe checkout', () => {
  it('only redirects to the HTTPS Stripe Checkout host', () => {
    expect(stripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_abc')).toContain('checkout.stripe.com');
    for (const url of ['http://checkout.stripe.com/pay', 'https://checkout.stripe.com.evil.test/pay', 'javascript:alert(1)']) expect(() => stripeCheckoutUrl(url)).toThrow();
  });
  it('reuses an attempt for retries and replaces it when the cart changes', () => {
    const saved = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => saved.get(key), setItem: (key: string, value: string) => saved.set(key, value) });
    const id = checkoutAttempt({ quantity: 1 });
    expect(checkoutAttempt({ quantity: 1 })).toBe(id);
    expect(checkoutAttempt({ quantity: 2 })).not.toBe(id);
  });
  it('reads authoritative status and uses POST for cancellation', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ paymentStatus: 'Pending', total: 50 }))));
    vi.stubGlobal('fetch', fetcher);
    expect((await stripeReceipt('cs_test_a', true)).paymentStatus).toBe('Pending');
    await stripeReceipt('cs_test_a', true, true);
    expect(fetcher.mock.calls[1][1].method).toBe('POST');
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ sessionId: 'cs_test_a' });
  });
  it('does not treat a provider failure as paid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('provider unavailable', { status: 503 })));
    await expect(stripeReceipt('cs_test_a', true)).rejects.toThrow();
  });
});
