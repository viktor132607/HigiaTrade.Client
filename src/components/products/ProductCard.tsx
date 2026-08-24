import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingBagIcon, StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { addItem } from "../../store/slices/cartSlice";
import { RootState } from "../../store";
import { formatCurrency } from "../../utils/currency";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface Product {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
  rating?: number;
  discountPercentage?: number;
  discountedPrice?: number;
  isNewProduct?: boolean;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const handleAddToCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error(isBg ? "Влез в профила си, за да добавиш продукт в количката." : "Please sign in before adding products to your cart.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to add product to cart.");
      }

      dispatch(
        addItem({
          id: product.id,
          title: product.title,
          regularPrice: product.regularPrice,
          quantity: 1,
          imageUrl: product.mainImageUrl,
          mainImageUrl: product.mainImageUrl,
          discountPercentage: product.discountPercentage,
          discountedPrice: product.discountedPrice,
        })
      );

      toast.success(isBg ? "Продуктът е добавен в количката." : "Product added to cart.");
    } catch (error) {
      console.error(error);
      toast.error(isBg ? "Продуктът не можа да бъде добавен." : "Unable to add the selected product.");
    }
  };

  const displayPrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
  const isLowStock = product.quantity > 0 && product.quantity <= 10;
  const stockLabel = product.quantity === 0
    ? (isBg ? "Няма наличност" : "Out of stock")
    : isLowStock
      ? (isBg ? "Ограничена наличност" : "Low stock")
      : (isBg ? "В наличност" : "In stock");

  return (
    <Link to={`/products/${product.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_90px_-50px_rgba(15,23,42,0.65)]">
        <div className="relative overflow-hidden">
          <img
            src={product.mainImageUrl || "/placeholder-image.jpg"}
            alt={product.title}
            className="h-60 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
          />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {product.isNewProduct ? (
              <span className="rounded-full bg-[#18b99f] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {isBg ? "Ново" : "New"}
              </span>
            ) : null}
            {product.discountPercentage ? (
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                -{product.discountPercentage}%
              </span>
            ) : null}
          </div>
          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
              product.quantity === 0
                ? "bg-rose-100 text-rose-700"
                : isLowStock
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {stockLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {isBg ? "Продукт" : "Product"}
            </p>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <StarIcon className="h-3.5 w-3.5" />
              {(product.rating ?? 0).toFixed(1)}
            </div>
          </div>

          <h3 className="mt-4 font-display text-xl font-semibold leading-tight text-slate-950 line-clamp-2">
            {product.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {product.description.replace(/<[^>]+>/g, " ")}
          </p>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-slate-950">{formatCurrency(displayPrice)}</p>
              {product.discountedPrice && product.discountedPrice > 0 ? (
                <p className="mt-1 text-sm text-slate-400 line-through">{formatCurrency(product.regularPrice)}</p>
              ) : null}
            </div>
            <span className={`text-xs ${product.quantity === 0 ? "font-semibold text-rose-600" : "text-slate-500"}`}>
              {product.quantity === 0
                ? (isBg ? "Няма наличност" : "Out of stock")
                : isBg
                  ? `${product.quantity} бр. налични`
                  : `${product.quantity} available`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
            className={`mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              product.quantity === 0
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "bg-slate-950 text-white hover:bg-primary-600"
            }`}
          >
            <ShoppingBagIcon className="h-5 w-5" />
            {product.quantity === 0
              ? (isBg ? "Няма наличност" : "Unavailable")
              : (isBg ? "Добави в количката" : "Add to cart")}
          </button>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
