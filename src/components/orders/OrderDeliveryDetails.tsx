export interface OrderDelivery {
  names?: string; phone?: string; city?: string; postalCode?: string; address?: string;
  paymentStatus?: string;
  deliveryRegion?: string; paymentMethod?: string; invoiceRequested?: boolean;
  invoiceCompanyName?: string; invoiceCompanyId?: string; invoiceVatId?: string; invoiceAddress?: string;
}
export default function OrderDeliveryDetails({ order, isBg }: { order: OrderDelivery; isBg: boolean }) {
  return <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
    <div className="min-w-0 break-words"><h3 className="font-semibold">{isBg ? 'Получател и адрес' : 'Recipient and address'}</h3><p>{order.names} · {order.phone}</p><p>{[order.deliveryRegion, order.postalCode, order.city, order.address].filter(Boolean).join(', ')}</p></div>
    <div><h3 className="font-semibold">{isBg ? 'Плащане' : 'Payment'}</h3><p>{order.paymentMethod === 'online-card' ? (isBg ? 'Карта чрез Stripe' : 'Card via Stripe') : order.paymentMethod === 'bank-transfer' ? (isBg ? 'Банков превод' : 'Bank transfer') : order.paymentMethod === 'cash-on-delivery' ? (isBg ? 'В брой при доставка' : 'Cash on delivery') : (isBg ? 'Не е указан' : 'Not specified')}</p>{order.paymentMethod === 'online-card' && <p className="mt-1 font-semibold">{order.paymentStatus === 'Paid' ? (isBg ? 'Платена' : 'Paid') : order.paymentStatus === 'Expired' ? (isBg ? 'Прекратено плащане' : 'Payment expired') : (isBg ? 'Очаква плащане' : 'Awaiting payment')}</p>}</div>
    {order.invoiceRequested && <div className="min-w-0 break-words sm:col-span-2"><h3 className="font-semibold">{isBg ? 'Заявена фактура' : 'Invoice requested'}</h3><p>{order.invoiceCompanyName} · {isBg ? 'ЕИК' : 'Company ID'}: {order.invoiceCompanyId}</p>{order.invoiceVatId && <p>{isBg ? 'ДДС номер' : 'VAT ID'}: {order.invoiceVatId}</p>}<p>{order.invoiceAddress}</p></div>}
  </div>;
}
