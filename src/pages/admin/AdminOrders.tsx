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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const ORDER_STATUS_OPTIONS_BG = [
  { value: OrderStatus.Created, label: "Чернова" },
  { value: OrderStatus.PendingVerification, label: "Чака преглед" },
  { value: OrderStatus.Verified, label: "Потвърдена" },
  { value: OrderStatus.Processing, label: "Обработва се" },
  { value: OrderStatus.Shipped, label: "Изпратена" },
  { value: OrderStatus.Delivered, label: "Доставена" },
  { value: OrderStatus.Cancelled, label: "Отказана" },
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [sortBy, setSortBy] = useState('createdOn');
  const [sortDescending, setSortDescending] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [currentPage, itemsPerPage, sortBy, sortDescending, orderId]);

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        PageNumber: orderId ? "1" : currentPage.toString(),
        PageSize: orderId ? "1" : itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString()
      });

      if (orderId) {
        queryParams.set("OrderId", orderId);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Поръчките не можаха да бъдат заредени.");
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
      console.error("Грешка при зареждане на поръчките:", error);
      toast.error("Списъкът с поръчки не можа да бъде зареден.");
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
        throw new Error("Статусът на поръчката не можа да бъде променен.");
      }

      toast.success("Статусът на поръчката е обновен.");
      fetchOrders();
    } catch (error) {
      console.error("Грешка при промяна на статуса на поръчката:", error);
      toast.error("Статусът на поръчката не можа да бъде променен.");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Поръчки</h1>
          {!orderId && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <label htmlFor="sortBy" className="text-sm text-gray-700">
                  Сортиране по:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="createdOn">Дата</option>
                  <option value="orderTotalPrice">Обща сума</option>
                  <option value="status">Статус</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <label htmlFor="sortOrder" className="text-sm text-gray-700">
                  Ред:
                </label>
                <select
                  id="sortOrder"
                  value={sortDescending ? 'desc' : 'asc'}
                  onChange={(e) => setSortDescending(e.target.value === 'desc')}
                  className="block w-28 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="desc">Най-нови</option>
                  <option value="asc">Най-стари</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  На страница:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {!loading && orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Няма поръчки за показване.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  id={`order-${order.id}`}
                  className={`overflow-hidden rounded-[2rem] bg-white shadow ${orderId === order.id ? "ring-2 ring-primary-500" : ""}`}
                >
                  <div className="p-6">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Поръчка #{order.id.slice(0, 8)}
                        </h2>
                        <p className="mt-1 break-all text-xs text-gray-400">{order.id}</p>
                        <p className="text-sm text-gray-500">
                          Дата: {order.createdOn ? formatDate(order.createdOn) : "Няма данни"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <select
                            value={order.status ?? OrderStatus.Created}
                            onChange={(e) =>
                              handleStatusChange(order.id, parseInt(e.target.value))
                            }
                            className={`w-full appearance-none rounded-md py-1 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-auto ${getOrderStatusColor(
                              order.status ?? OrderStatus.Created
                            )}`}
                          >
                            {ORDER_STATUS_OPTIONS_BG.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                          Общо за поръчката:
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(order.orderTotalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!orderId && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-600"
                  } text-white`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-gray-700">
                  Страница {currentPage} от {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-600"
                  } text-white`}
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
