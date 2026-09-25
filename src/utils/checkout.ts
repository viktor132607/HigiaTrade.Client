import { formatCurrency } from './currency';

export const MINIMUM_ORDER = 50;
export const DELIVERY_REGIONS = [
  { bg: 'Русе', en: 'Ruse' }, { bg: 'Силистра', en: 'Silistra' },
  { bg: 'Разград', en: 'Razgrad' }, { bg: 'Свищов', en: 'Svishtov' },
  { bg: 'Бяла', en: 'Byala' }, { bg: 'Търговище', en: 'Targovishte' },
];
export const minimumOrderMessage = (total: number, bg: boolean) => bg
  ? `Минималната поръчка е ${formatCurrency(MINIMUM_ORDER)}. Добавете продукти за още ${formatCurrency(Math.max(0, MINIMUM_ORDER - total))}.`
  : `The minimum order is ${formatCurrency(MINIMUM_ORDER)}. Add ${formatCurrency(Math.max(0, MINIMUM_ORDER - total))} more.`;

export function checkoutErrorMessage(raw: string, status: number, bg: boolean): string {
  let message = raw;
  try { const data = JSON.parse(raw); message = String(data.message ?? data.Message ?? data.detail ?? data.title ?? raw); } catch { /* Plain-text API error. */ }
  if (status === 401 || status === 403) return bg ? 'Сесията изтече. Влезте отново, за да продължите.' : 'Your session expired. Sign in again to continue.';
  if (/stock|quantity|no longer available/i.test(message) || status === 409) return bg ? 'Някои продукти са изчерпани или количеството е недостатъчно. Коригирайте количката и опитайте отново.' : 'Some products are unavailable or have insufficient stock. Update your cart and try again.';
  if (/minimum order/i.test(message)) return bg ? 'Минималната стойност на поръчката е 50 €. Допълнете количката.' : 'The minimum order value is €50. Add more products.';
  if (/region|delivery address/i.test(message)) return bg ? 'Изберете адрес в обслужваните райони: Русе, Силистра, Разград, Свищов, Бяла и Търговище.' : 'Select an address in Ruse, Silistra, Razgrad, Svishtov, Byala or Targovishte.';
  if (/invoice/i.test(message)) return bg ? 'Попълнете име на фирма, валиден ЕИК и адрес за фактура. Проверете ДДС номера.' : 'Enter the company name, valid company ID and billing address. Check the VAT number.';
  if (/payment|delivery method/i.test(message)) return bg ? 'Избраният начин на плащане или доставка не е наличен. Изберете отново.' : 'The selected payment or delivery method is unavailable. Choose again.';
  if (status === 404 || /empty|order not found/i.test(message)) return bg ? 'Количката е празна или продуктът вече не е наличен.' : 'Your cart is empty or the product is no longer available.';
  if (status === 400) return bg ? 'Проверете въведените данни и съгласието за обработка на поръчката.' : 'Check your details and order consent.';
  return bg ? 'Заявката не беше потвърдена. Проверете връзката си и опитайте отново. При изпратена поръчка първо проверете статуса ѝ или се свържете с нас.' : 'The request was not confirmed. Check your connection and try again. If you submitted an order, check its status or contact us first.';
}

export async function ensureResponse(response: Response, bg: boolean) {
  if (!response.ok) throw new Error(checkoutErrorMessage(await response.text(), response.status, bg));
}

export interface CheckoutItem { productId: string; quantity: number; title: string; totalPrice: number; singlePrice?: number; primaryImageUri?: string; }
export async function refreshCheckoutItems(items: CheckoutItem[], bg: boolean): Promise<CheckoutItem[]> {
  return Promise.all(items.map(async item => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${item.productId}`).catch(() => { throw new Error(checkoutErrorMessage("", 500, bg)); });
    await ensureResponse(response, bg);
    const product = await response.json();
    if (product.isActive === false || !Number.isInteger(item.quantity) || item.quantity < 1 || product.quantity < item.quantity) {
      throw new Error(bg ? `„${item.title}“: налични ${product.isActive === false ? 0 : product.quantity} бр., заявени ${item.quantity} бр. Коригирайте количката.` : `${item.title}: ${product.isActive === false ? 0 : product.quantity} available, ${item.quantity} requested. Update your cart.`);
    }
    let price = product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
    if (product.wholesalePriceInclVat > 0 && product.wholesaleMinQuantity > 0 && item.quantity >= product.wholesaleMinQuantity) {
      price = product.wholesalePriceInclVat * (1 - (product.discountPercentage || 0) / 100);
    }
    if (!Number.isFinite(price) || price < 0) throw new Error(checkoutErrorMessage('', 500, bg));
    const singlePrice = Math.round((price + Number.EPSILON) * 100) / 100;
    return { ...item, singlePrice, totalPrice: Math.round(singlePrice * item.quantity * 100) / 100 };
  }));
}
