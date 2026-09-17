import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { removeFromWishlist } from "../store/slices/userSlice";
import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { addItem } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/currency";
import ProductActions from "../components/products/ProductActions";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { toast } from "react-toastify";

interface Product {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
  discountPercentage?: number;
  discountedPrice?: number;
}

const Wishlist = () => {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wishlist } = useSelector((state: RootState) => state.user);
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        setLoading(true);
        const products = await Promise.all(
          wishlist.map(async (productId) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error(isBg ? "Един от запазените продукти не можа да бъде зареден." : "We could not load one of the saved products.");
            return response.json();
          })
        );
        setWishlistProducts(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : isBg ? "Любимите продукти не можаха да бъдат заредени." : "We could not load your saved products.");
      } finally {
        setLoading(false);
      }
    };

    if (wishlist.length > 0) void fetchWishlistProducts();
    else setLoading(false);
  }, [wishlist, token, isBg]);

  const handleCartAction = async (product: Product, openCart: boolean) => {
    if (product.quantity <= 0) return;

    try {
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        if (!response.ok) throw new Error("Unable to add product to cart.");
      }

      dispatch(addItem({
        id: product.id,
        title: product.title,
        regularPrice: product.regularPrice,
        discountedPrice: product.discountedPrice,
        discountPercentage: product.discountPercentage,
        quantity: 1,
        mainImageUrl: product.mainImageUrl,
        imageUrl: product.mainImageUrl,
      }));

      if (openCart) {
        navigate("/cart");
      } else {
        window.dispatchEvent(new CustomEvent("higiatrade:cart-preview-open"));
        toast.success(isBg ? "Продуктът е добавен в количката." : "Product added to cart.");
      }
    } catch {
      toast.error(isBg ? "Продуктът не можа да бъде добавен." : "Unable to add the selected product.");
    }
  };

  if (loading) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-500" /></div>;
  if (error) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4"><div className="text-center text-red-600">{error}</div></div>;

  if (wishlist.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-3 py-10 sm:px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 text-center shadow-lg sm:rounded-[2rem] sm:p-8">
          <HeartIcon className="mx-auto mb-4 h-14 w-14 text-primary-500 sm:h-16 sm:w-16" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{isBg ? "Любимите са празни" : "Your wishlist is empty"}</h1>
          <p className="mb-6 text-gray-600">{isBg ? "Запазвай продукти тук, за да ги намериш лесно по-късно." : "Save products here so you can come back to them later."}</p>
          <Link to="/products" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-500 px-6 py-3 text-white hover:bg-primary-600">{isBg ? "Разгледай продуктите" : "Browse products"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{isBg ? "Любими" : "Wishlist"}</h1>
          <span className="text-sm text-gray-600 sm:text-base">{wishlistProducts.length} {isBg ? (wishlistProducts.length === 1 ? "продукт" : "продукта") : (wishlistProducts.length === 1 ? "product" : "products")}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistProducts.map((product) => {
            const displayPrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
            return (
              <article key={product.id} className="overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-lg sm:rounded-[2rem]">
                <div className="relative">
                  <Link to={`/products/${product.id}`} className="block aspect-square w-full overflow-hidden bg-gray-200"><img src={product.mainImageUrl || "/higiqlogo.png"} alt={product.title} className="h-full w-full object-cover object-center" /></Link>
                  <button type="button" onClick={() => dispatch(removeFromWishlist(product.id))} className="absolute right-2 top-2 flex min-h-10 min-w-10 items-center justify-center rounded-full bg-white p-2 shadow-md hover:bg-gray-100" title={isBg ? "Премахни от любими" : "Remove from wishlist"}><HeartIcon className="h-5 w-5 text-red-500" /></button>
                </div>

                <div className="p-4">
                  <h2 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 sm:text-lg"><Link to={`/products/${product.id}`} className="hover:text-primary-500">{product.title}</Link></h2>
                  <div className="mb-4 space-y-1"><p className="text-lg font-bold text-gray-900">{formatCurrency(displayPrice)}</p>{product.discountedPrice && product.discountedPrice > 0 ? <p className="text-sm text-gray-500 line-through">{formatCurrency(product.regularPrice)}</p> : null}</div>
                  <div className="mb-3"><ProductActions productId={product.id} showLabels compact /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void handleCartAction(product, true)} disabled={product.quantity <= 0} className={`flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-white ${product.quantity <= 0 ? "cursor-not-allowed bg-slate-300" : "bg-[#18b99f] hover:bg-[#149f8a]"}`}>{product.quantity <= 0 ? (isBg ? "Изчерпан" : "Unavailable") : (isBg ? "Купи" : "Buy")}</button>
                    <button type="button" onClick={() => void handleCartAction(product, false)} disabled={product.quantity <= 0} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-semibold text-white sm:text-xs ${product.quantity <= 0 ? "cursor-not-allowed bg-slate-300" : "bg-slate-950 hover:bg-slate-800"}`}><ShoppingCartIcon className="h-4 w-4 shrink-0" />{product.quantity <= 0 ? (isBg ? "Няма" : "Out") : (isBg ? "Добави в количка" : "Add to cart")}</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
