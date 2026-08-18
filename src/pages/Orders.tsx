import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { toast } from "react-toastify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  OrderStatus,
  getOrderStatusText,
  getOrderStatusColor,
} from "../enums/OrderStatus";
import { decodeJWT } from "../utils/jwtUtils";
import { formatCurrency } from "../utils/currency";

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
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    title: string;
  }>;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [sortBy, setSortBy] = useState('createdOn');
  const [sortDescending, setSortDescending] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);

  // Get user ID from JWT token
  const getUserIdFromToken = () => {
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, itemsPerPage, sortBy, sortDescending]);

  const fetchOrders = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        toast.error("We could not identify your account.");
        return;
      }

      const queryParams = new URLSearchParams({
        PageNumber: currentPage.toString(),
        PageSize: itemsPerPage.toString(),
        SortBy: sortBy,
        SortDescending: sortDescending.toString(),
        UserId: userId
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      let ordersArray = [];
      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data && data.items && Array.isArray(data.items)) {
        ordersArray = data.items;
        if (data.totalCount) {
          setTotalPages(Math.ceil(data.totalCount / itemsPerPage));
        }
      }

      setOrders(ordersArray);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("We could not load your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/change-status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            orderStatus: OrderStatus.Cancelled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      toast.success("Order cancelled.");
      fetchOrders();
    } catch (error) {
      console.error("Error canceling order:", error);
      toast.error("We could not cancel this order.");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing items per page
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
          <h1 className="text-2xl font-bold text-gray-900">My orders</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="sortBy" className="text-sm text-gray-700">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="createdOn">Date</option>
                <option value="orderTotalPrice">Total</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="sortOrder" className="text-sm text-gray-700">
                Order:
              </label>
              <select
                id="sortOrder"
                value={sortDescending ? 'desc' : 'asc'}
                onChange={(e) => setSortDescending(e.target.value === 'desc')}
                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Per page:
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
        </div>

        {!loading && orders && orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven’t placed any orders yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders &&
                orders.map((order) => (
                  <div
                    key={order?.id || Math.random()}
                    className="overflow-hidden rounded-[2rem] bg-white shadow"
                  >
                    <div className="p-6">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Order #{order?.id ? order.id.slice(0, 8) : "N/A"}
                          </h2>
                          <p className="text-sm text-gray-500">
                            Date:{" "}
                            {order?.createdOn
                              ? formatDate(order.createdOn)
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                              order?.status || OrderStatus.Created
                            )}`}
                          >
                            {getOrderStatusText(
                              order?.status || OrderStatus.Created
                            )}
                          </span>
                          {order?.status !== OrderStatus.Cancelled && (
                            <button
                              onClick={() =>
                                order?.id && handleCancelOrder(order.id)
                              }
                              className="flex items-center text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                            >
                              <XMarkIcon className="h-5 w-5 mr-1" />
                              Cancel order
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            Order total:
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(order?.orderTotalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
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
                  Page {currentPage} of {totalPages}
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

export default Orders;
