import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { toast } from "react-toastify";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  OrderStatus,
  getOrderStatusColor,
} from "../../enums/OrderStatus";
import { formatCurrency } from "../../utils/currency";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Order {
  id: string;
  userId: string;
  names: string;
  postalCode: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  status: number;
  createdOn: string;
  orderTotalPrice: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    title: string;
  }>;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "adminOrdersItemsPerPage";

const getInitialPageSize = () => {
  if (typeof window === "undefined") return PAGE_SIZE_OPTIONS[0];
  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(saved) ? saved : PAGE_SIZE_OPTIONS[0];
};

const statusOptions = (isBg: boolean) => [
  { value: OrderStatus.Created, label: isBg ? "Чернова" : "Draft" },
  { value: OrderStatus.PendingVerification, label: isBg ? "Чака преглед" : "Pending review" },
  { value: OrderStatus.Verified, label: isBg ? "Потвърдена" : "Verified" },
  { value: OrderStatus.Processing, label: isBg ? "Обработва се" : "Processing" },
  { value: OrderStatus.Shipped, label: isBg ? "Изпратена" : "Shipped" },
  { value: OrderStatus.Delivered, label: isBg ? "Доставена" : "Delivered" },
  { value: OrderStatus.Cancelled, label: isBg ? "Отказана" : "Cancelled" },
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialPageSize);
  const [sortBy, setSortBy] = useState("createdOn");
  const [sortDescending, setSortDescending] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const orderStatusOptions = statusOptions(isBg);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isBg ? "bg-BG" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    setLoading(true);
    void fetchOrders();
  }, [currentPage, itemsPerPage, sortBy, sortDescending, orderId]);

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        PageNumber: orderId ? "1" : currentPage.toString(),
        PageSize: orderId ? "1" : itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
      });

      if (orderId) queryParams.set("OrderId", orderId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(isBg ? "Поръчките не можаха да бъдат заредени." : "Orders could not be loaded.");
      }

      const data = await response.json();
      let ordersArray: Order[] = [];

      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data && data.items && Array.isArray(data.items)) {
        ordersArray = data.items;
        if (orderId) {
          setTotalPages(1);
        } else if (data.totalCount) {
          setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
        } else {
          setTotalPages(1);
        }
      }

      setOrders(ordersArray);
    } catch (error) {
      console.error("Admin orders load failed:", error);
      toast.error(isBg ? "Списъкът с поръчки не можа да бъде зареден." : "The order list could not be loaded.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderIdValue: string, newStatus: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/change-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus: newStatus, orderId: orderIdValue }),
        }
      );

      if (!response.ok) {
        throw new Error(isBg ? "Статусът на поръчката не можа да бъде променен." : "The order status could not be changed.");
      }

      toast.success(isBg ? "Статусът на поръчката е обновен." : "Order status updated.");
      void fetchOrders();
    } catch (error) {
      console.error("Order status update failed:", error);
      toast.error(isBg ? "Статусът на поръчката не можа да бъде променен." : "The order status could not be changed.");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(newSize));
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-0 py-2 sm:px-2 sm:py-4 lg:px-4 lg:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{isBg ? "Поръчки" : "Orders"}</h1>
          {!orderId && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
              <label className="grid gap-1 text-sm text-gray-700">
                <span>{isBg ? "Сортиране по:" : "Sort by:"}</span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="block min-h-11 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:min-w-36 sm:text-sm"
                >
                  <option value="createdOn">{isBg ? "Дата" : "Date"}</option>
                  <option value="orderTotalPrice">{isBg ? "Обща сума" : "Total amount"}</option>
                  <option value="status">{isBg ? "Статус" : "Status"}</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm text-gray-700">
                <span>{isBg ? "Ред:" : "Order:"}</span>
                <select
                  value={sortDescending ? "desc" : "asc"}
                  onChange={(event) => {
                    setSortDescending(event.target.value === "desc");
                    setCurrentPage(1);
                  }}
                  className="block min-h-11 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:min-w-32 sm:text-sm"
                >
                  <option value="desc">{isBg ? "Най-нови" : "Newest"}</option>
                  <option value="asc">{isBg ? "Най-стари" : "Oldest"}</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm text-gray-700">
                <span>{isBg ? "На страница:" : "Per page:"}</span>
                <select
                  value={itemsPerPage}
                  onChange={(event) => handleItemsPerPageChange(Number(event.target.value))}
                  className="block min-h-11 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:min-w-28 sm:text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{isBg ? "Няма поръчки за показване." : "No orders to show."}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => (
                <article
                  key={order.id}
                  id={`order-${order.id}`}
                  className={`overflow-hidden rounded-2xl bg-white shadow sm:rounded-[2rem] ${orderId === order.id ? "ring-2 ring-primary-500" : ""}`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                          {isBg ? "Поръчка" : "Order"} #{order.id.slice(0, 8)}
                        </h2>
                        <p className="mt-1 break-all text-xs text-gray-400">{order.id}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {isBg ? "Дата" : "Date"}: {order.createdOn ? formatDate(order.createdOn) : isBg ? "Няма данни" : "No data"}
                        </p>
                      </div>

                      <div className="relative w-full sm:w-auto">
                        <select
                          value={order.status ?? OrderStatus.Created}
                          onChange={(event) => handleStatusChange(order.id, Number.parseInt(event.target.value, 10))}
                          className={`min-h-11 w-full appearance-none rounded-md py-2 pl-3 pr-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-auto ${getOrderStatusColor(order.status ?? OrderStatus.Created)}`}
                        >
                          {orderStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-5 sm:mt-6 sm:pt-6">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-base font-semibold text-gray-900 sm:text-lg">
                          {isBg ? "Общо за поръчката:" : "Order total:"}
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(order.orderTotalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!orderId && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`rounded-md p-2 ${currentPage === 1 ? "cursor-not-allowed bg-gray-200" : "bg-primary-500 hover:bg-primary-600"} text-white`}
                  aria-label={isBg ? "Предишна страница" : "Previous page"}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700 sm:text-base">
                  {isBg ? `Страница ${currentPage} от ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`rounded-md p-2 ${currentPage === totalPages ? "cursor-not-allowed bg-gray-200" : "bg-primary-500 hover:bg-primary-600"} text-white`}
                  aria-label={isBg ? "Следваща страница" : "Next page"}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
