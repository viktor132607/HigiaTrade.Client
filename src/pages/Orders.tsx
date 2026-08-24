import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { OrderStatus, getOrderStatusColor } from "../enums/OrderStatus";
import { decodeJWT } from "../utils/jwtUtils";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface Order {
  id: string;
  userId: string;
  names: string;
  postalCode: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  status: OrderStatus;
  createdOn: string;
  orderTotalPrice: number;
  items: Array<{ productId: string; quantity: number; price: number; title: string }>;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "customerOrdersItemsPerPage";

const Orders = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === "undefined") return 20;
    const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 20;
  });
  const [sortBy, setSortBy] = useState("createdOn");
  const [sortDescending, setSortDescending] = useState(true);

  const getUserIdFromToken = () => {
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
  };

  const statusText = (status: OrderStatus) => {
    const labels: Partial<Record<OrderStatus, [string, string]>> = {
      [OrderStatus.Created]: ["Създадена", "Created"],
      [OrderStatus.PendingVerification]: ["Чака потвърждение", "Pending verification"],
      [OrderStatus.Verified]: ["Потвърдена", "Verified"],
      [OrderStatus.Processing]: ["Обработва се", "Processing"],
      [OrderStatus.Shipped]: ["Изпратена", "Shipped"],
      [OrderStatus.Delivered]: ["Доставена", "Delivered"],
      [OrderStatus.Cancelled]: ["Отказана", "Cancelled"],
    };
    const pair = labels[status] ?? ["Неизвестен статус", "Unknown status"];
    return isBg ? pair[0] : pair[1];
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(isBg ? "bg-BG" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = getUserIdFromToken();
      if (!userId) {
        toast.error(isBg ? "Профилът не можа да бъде разпознат." : "We could not identify your account.");
        return;
      }
      const queryParams = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
        UserId: userId,
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setOrders(items);
      setTotalPages(data?.totalCount ? Math.max(1, Math.ceil(data.totalCount / itemsPerPage)) : 1);
    } catch (error) {
      console.error("Orders load failed:", error);
      toast.error(isBg ? "Поръчките не можаха да бъдат заредени." : "We could not load your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [currentPage, itemsPerPage, sortBy, sortDescending]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/change-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderStatus: OrderStatus.Cancelled }),
      });
      if (!response.ok) throw new Error("Failed to cancel order");
      toast.success(isBg ? "Поръчката е отказана." : "Order cancelled.");
      void fetchOrders();
    } catch (error) {
      console.error("Order cancellation failed:", error);
      toast.error(isBg ? "Поръчката не можа да бъде отказана." : "We could not cancel this order.");
    }
  };

  if (loading) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" /></div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{isBg ? "Моите поръчки" : "My orders"}</h1>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm text-gray-700">{isBg ? "Сортиране по:" : "Sort by:"}<select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1); }} className="min-h-11 w-full rounded-md border-gray-300 shadow-sm sm:min-w-32"><option value="createdOn">{isBg ? "Дата" : "Date"}</option><option value="orderTotalPrice">{isBg ? "Обща сума" : "Total"}</option><option value="status">{isBg ? "Статус" : "Status"}</option></select></label>
            <label className="grid gap-1 text-sm text-gray-700">{isBg ? "Ред:" : "Order:"}<select value={sortDescending ? "desc" : "asc"} onChange={(event) => { setSortDescending(event.target.value === "desc"); setCurrentPage(1); }} className="min-h-11 w-full rounded-md border-gray-300 shadow-sm sm:min-w-32"><option value="desc">{isBg ? "Най-нови" : "Newest first"}</option><option value="asc">{isBg ? "Най-стари" : "Oldest first"}</option></select></label>
            <label className="grid gap-1 text-sm text-gray-700">{isBg ? "На страница:" : "Per page:"}<select value={itemsPerPage} onChange={(event) => { const value = Number(event.target.value); setItemsPerPage(value); setCurrentPage(1); window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(value)); }} className="min-h-11 w-full rounded-md border-gray-300 shadow-sm sm:min-w-28">{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-gray-500">{isBg ? "Все още нямаш направени поръчки." : "You haven’t placed any orders yet."}</div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => (
                <article key={order.id} className="overflow-hidden rounded-2xl bg-white shadow sm:rounded-[2rem]">
                  <div className="p-4 sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{isBg ? "Поръчка" : "Order"} #{order.id.slice(0, 8)}</h2>
                        <p className="mt-1 text-sm text-gray-500">{isBg ? "Дата" : "Date"}: {order.createdOn ? formatDate(order.createdOn) : "N/A"}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${getOrderStatusColor(order.status || OrderStatus.Created)}`}>{statusText(order.status || OrderStatus.Created)}</span>
                        {order.status !== OrderStatus.Cancelled && (
                          <button type="button" onClick={() => void handleCancelOrder(order.id)} className="inline-flex min-h-10 items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"><XMarkIcon className="mr-1 h-5 w-5" />{isBg ? "Откажи поръчката" : "Cancel order"}</button>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 border-t border-gray-200 pt-5 sm:mt-6 sm:pt-6"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-base font-semibold text-gray-900 sm:text-lg">{isBg ? "Общо за поръчката:" : "Order total:"}</span><span className="text-lg font-semibold text-gray-900">{formatCurrency(order.orderTotalPrice)}</span></div></div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className={`rounded-md p-2 ${currentPage === 1 ? "cursor-not-allowed bg-gray-200" : "bg-primary-500 hover:bg-primary-600"} text-white`} aria-label={isBg ? "Предишна страница" : "Previous page"}><ChevronLeftIcon className="h-5 w-5" /></button>
                <span className="text-sm text-gray-700 sm:text-base">{isBg ? `Страница ${currentPage} от ${totalPages}` : `Page ${currentPage} of ${totalPages}`}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className={`rounded-md p-2 ${currentPage === totalPages ? "cursor-not-allowed bg-gray-200" : "bg-primary-500 hover:bg-primary-600"} text-white`} aria-label={isBg ? "Следваща страница" : "Next page"}><ChevronRightIcon className="h-5 w-5" /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
