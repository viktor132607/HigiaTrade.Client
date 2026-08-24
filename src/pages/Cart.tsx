import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

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
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateQueue, setUpdateQueue] = useState<{ productId: string; newQuantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          setCart(null);
          return;
        }
        throw new Error("Failed to fetch cart items");
      }
      setCart(await response.json());
    } catch (error) {
      console.error("Cart load failed:", error);
      toast.error(isBg ? "Количката не можа да бъде заредена." : "We could not load your cart.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCartItems();
  }, []);

  useEffect(() => {
    const processQueue = async () => {
      if (updateQueue.length === 0 || isProcessing) return;
      setIsProcessing(true);
      const { productId, newQuantity } = updateQueue[0];

      try {
        const item = cart?.items.find((entry) => entry.productId === productId);
        if (!item) return;
        setCart((previous) => previous ? { ...previous, items: previous.items.map((entry) => entry.productId === productId ? { ...entry, quantity: newQuantity } : entry) } : null);

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders${newQuantity < item.quantity ? "/" : ""}`, {
          method: newQuantity < item.quantity ? "DELETE" : "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        await fetchCartItems();
      } catch (error) {
        console.error("Cart quantity update failed:", error);
        await fetchCartItems();
      } finally {
        setUpdateQueue((previous) => previous.slice(1));
        setIsProcessing(false);
      }
    };
    void processQueue();
  }, [updateQueue, isProcessing]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdateQueue((previous) => [...previous, { productId, newQuantity }]);
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const item = cart?.items.find((entry) => entry.productId === productId);
      if (!item) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: item.quantity }),
      });
      if (!response.ok) throw new Error("Failed to remove item");
      await fetchCartItems();
      toast.success(isBg ? "Продуктът е премахнат от количката." : "Item removed from your cart.");
    } catch (error) {
      console.error("Cart item removal failed:", error);
      toast.error(isBg ? "Продуктът не можа да бъде премахнат." : "We could not remove that item.");
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" /></div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-3 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-5 text-center shadow-xl sm:rounded-[2rem] sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">{isBg ? "Количката е празна" : "Your cart is empty"}</h1>
          <p className="text-gray-600">{isBg ? "Разгледай продуктите и добави това, което ти трябва." : "Browse the catalog and add the products you need."}</p>
          <Link to="/products" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">{isBg ? "Разгледай продуктите" : "Browse products"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-5 text-center text-2xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">{isBg ? "Количка" : "Cart"}</h1>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-[2rem]">
          <div className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <div key={item.productId} className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-4 sm:p-6 lg:grid-cols-[112px_minmax(0,1fr)_auto] lg:items-center">
                <img src={item.primaryImageUri || "/placeholder-image.jpg"} alt={item.title} className="h-20 w-20 rounded-xl object-cover sm:h-28 sm:w-28 sm:rounded-2xl" />
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-sm font-medium text-gray-900 sm:text-lg">{item.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                    <span className="font-semibold text-primary-600">{formatCurrency(item.singlePrice)}</span><span className="text-gray-400">×</span><span className="font-semibold text-primary-600">{item.quantity}</span><span className="text-gray-400">=</span><span className="font-semibold text-primary-600">{formatCurrency(item.singlePrice * item.quantity)}</span>
                  </div>
                </div>

                <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:pl-[128px] lg:col-span-1 lg:pl-0">
                  <div className="flex items-center rounded-xl border border-gray-300 bg-slate-50">
                    <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity - 1)} className={`min-h-11 min-w-11 px-3 py-2 ${item.quantity <= 1 ? "cursor-not-allowed text-slate-300" : "text-slate-700 hover:text-primary-700"}`} disabled={item.quantity <= 1} aria-label={isBg ? "Намали количеството" : "Decrease quantity"}>−</button>
                    <span className="min-w-[2.5rem] px-2 py-2 text-center text-gray-900">{item.quantity}</span>
                    <button type="button" onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="min-h-11 min-w-11 px-3 py-2 text-slate-700 hover:text-primary-700" aria-label={isBg ? "Увеличи количеството" : "Increase quantity"}>+</button>
                  </div>
                  <button type="button" onClick={() => void handleRemoveItem(item.productId)} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={isBg ? "Премахни от количката" : "Remove from cart"}><XMarkIcon className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-semibold text-gray-900 sm:text-xl">{isBg ? "Общо за поръчката:" : "Order total:"} {formatCurrency(cart.orderTotalPrice)}</p>
              <button type="button" onClick={() => navigate("/checkout")} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-700 sm:w-auto">{isBg ? "Към завършване на поръчката" : "Continue to checkout"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
