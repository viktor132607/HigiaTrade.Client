import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "../utils/currency";

interface CartItem {
  productId: string;
  singlePrice: number;
  totalPrice: number;
  quantity: number;
  title: string;
  primaryImageUri: string;
}

interface CartResponse {
  id: string;
  orderTotalPrice: number;
  items: CartItem[];
}

const Cart = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateQueue, setUpdateQueue] = useState<
    { productId: string; newQuantity: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // If cart is empty, set cart to null and return
          setCart(null);
          return;
        }
        throw new Error("Failed to fetch cart items");
      }

      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast.error("We could not load your cart.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const processQueue = async () => {
      if (updateQueue.length === 0 || isProcessing) return;

      setIsProcessing(true);
      const { productId, newQuantity } = updateQueue[0];

      try {
        const item = cart?.items.find((item) => item.productId === productId);
        if (!item) return;

        // Update local state immediately for better UX
        const updatedItems = cart?.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
        setCart((prev) =>
          prev ? { ...prev, items: updatedItems || [] } : null
        );

        // Make API request
        if (newQuantity < item.quantity) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: productId,
              quantity: 1,
            }),
          });
        } else {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: productId,
              quantity: 1,
            }),
          });
        }

        // Refresh cart data
        await fetchCartItems();
      } catch (error) {
        console.error("Error updating quantity:", error);
        await fetchCartItems();
      } finally {
        // Remove processed item from queue
        setUpdateQueue((prev) => prev.slice(1));
        setIsProcessing(false);
      }
    };

    processQueue();
  }, [updateQueue, isProcessing]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Add to queue
    setUpdateQueue((prev) => [...prev, { productId, newQuantity }]);
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const item = cart?.items.find((item) => item.productId === productId);
      if (!item) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: productId,
            quantity: item.quantity,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      await fetchCartItems(); // Refresh the cart
      toast.success("Item removed from your cart.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("We could not remove that item.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-[2rem] bg-white p-6 text-center shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h2>
          <p className="text-gray-600">
            Start browsing the catalog to find the gear you need.
          </p>
          <Link
            to="/products"
            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-gray-900">Cart</h1>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center"
              >
                <img
                  src={item.primaryImageUri || "/placeholder-image.jpg"}
                  alt={item.title}
                  className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="line-clamp-2 text-lg font-medium text-gray-900">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-primary-600 font-semibold">
                      {formatCurrency(item.singlePrice)}
                    </p>
                    <span className="text-gray-400">×</span>
                    <p className="text-primary-600 font-semibold">
                      {item.quantity}
                    </p>
                    <span className="text-gray-400">=</span>
                    <p className="text-primary-600 font-semibold">
                      {formatCurrency(item.singlePrice * item.quantity)}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-3 lg:w-auto lg:justify-end">
                  <div className="flex items-center rounded-xl border border-gray-300 bg-slate-50">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity - 1)
                      }
                      className={`px-3 py-2 transition-colors ${
                        item.quantity <= 1
                          ? "cursor-not-allowed text-slate-300"
                          : "text-slate-700 hover:text-primary-700"
                      }`}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="min-w-[2.5rem] px-3 py-2 text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.productId, item.quantity + 1)
                      }
                      className="px-3 py-2 text-slate-700 transition-colors hover:text-primary-700"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="rounded-full border border-rose-200 p-2 text-rose-600 transition-colors hover:bg-rose-50"
                    title="Remove from cart"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xl font-semibold text-gray-900">
                  Order total: {formatCurrency(cart.orderTotalPrice)}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Continue to checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
