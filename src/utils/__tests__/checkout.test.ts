import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkoutErrorMessage, minimumOrderMessage, refreshCheckoutItems, DELIVERY_REGIONS } from '../checkout';
const item = { productId: 'p', title: 'Soap', quantity: 2, totalPrice: 60 };
afterEach(() => vi.unstubAllGlobals());
describe('Checkout guards', () => {
  it('lists all six published delivery areas', () => {
    expect(DELIVERY_REGIONS.map(r => r.bg)).toEqual(['Русе','Силистра','Разград','Свищов','Бяла','Търговище']);
  });
  it('shows the exact missing minimum amount', () => {
    expect(minimumOrderMessage(49.99, true)).toContain('0,01');
    expect(minimumOrderMessage(0, false)).toContain('50,00');
  });
  it.each([401,403,404,409,400,500])('does not expose internal error details for %s', status => {
    expect(checkoutErrorMessage('{"message":"internal stack trace"}', status, true)).not.toContain('stack');
  });
  it('refreshes current prices and applies wholesale discount', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ quantity: 5, isActive: true, regularPrice: 30, wholesalePriceInclVat: 25, wholesaleMinQuantity: 2, discountPercentage: 10 }))));
    expect((await refreshCheckoutItems([item], true))[0].totalPrice).toBe(45);
  });
  it('blocks stock shortage with the product and available quantity', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ quantity: 1, regularPrice: 30 }))));
    await expect(refreshCheckoutItems([item], true)).rejects.toThrow('„Soap“: налични 1');
  });
  it('blocks inactive products and failed availability requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ quantity: 10, isActive: false }))).mockResolvedValueOnce(new Response('internal', {status: 500})));
    await expect(refreshCheckoutItems([item], false)).rejects.toThrow('0 available');
    await expect(refreshCheckoutItems([item], false)).rejects.toThrow('not confirmed');
  });
});
