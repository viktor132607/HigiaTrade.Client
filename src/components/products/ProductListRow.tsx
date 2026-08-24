import { Link } from "react-router-dom";
import { ShoppingCartIcon, StarIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { addItem } from "../../store/slices/cartSlice";
import { Product } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import ProductActions from "./ProductActions";

type Props = {
  product: Product;
  compact?: boolean;
};

const ProductListRow = ({ product, compact = false }: Props) => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const displayPrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;

  const addToCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
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
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Unable to add product to cart.");

      dispatch(addItem({
        id: product.id,
        title: product.title,
        regularPrice: product.regularPrice,
        discountedPrice: product.discountedPrice,
        discountPercentage: product.discountPercentage,
        quantity: 1,
        imageUrl: product.mainImageUrl,
        mainImageUrl: product.mainImageUrl,
      }));
      toast.success(isBg ? "Продуктът е добавен в количката." : "Product added to cart.");
    } catch {
      toast.error(isBg ? "Продуктът не можа да бъде добавен." : "Unable to add the selected product.");
    }
  };

  if (compact) {
    return (
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-white px-3 py-3 last:border-b-0 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center">
        <Link to={`/products/${product.id}`} className="h-16 w-16 overflow-hidden bg-slate-50 sm:h-20 sm:w-20">
          <img src={product.mainImageUrl || "/placeholder-image.jpg"} alt={product.title} className="h-full w-full object-contain" />
        </Link>

        <div className="min-w-0">
          <Link to={`/products/${product.id}`} className="line-clamp-2 text-sm font-bold text-slate-950 hover:text-[#18b99f] sm:text-base">
            {product.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
              {product.quantity > 0 ? (isBg ? "В наличност" : "In stock") : (isBg ? "Няма наличност" : "Out of stock")}
            </span>
            <span className="flex items-center gap-1 text-slate-400"><StarIcon className="h-3.5 w-3.5" />{(product.rating ?? 0).toFixed(1)}</span>
            {product.brand ? <span className="text-slate-500">{product.brand}</span> : null}
          </div>
          <div className="mt-2 sm:hidden">
            <span className="text-lg font-bold text-slate-950">{formatCurrency(displayPrice)}</span>
          </div>
        </div>

        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
          <div className="hidden text-right sm:block">
            <div className="text-xl font-black text-slate-950">{formatCurrency(displayPrice)}</div>
            {product.discountedPrice && product.discountedPrice > 0 ? <div className="text-xs text-slate-400 line-through">{formatCurrency(product.regularPrice)}</div> : null}
          </div>
          <ProductActions productId={product.id} showLabels compact />
          <button
            type="button"
            onClick={addToCart}
            disabled={product.quantity === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold text-white ${product.quantity === 0 ? "cursor-not-allowed bg-slate-300" : "bg-orange-500 hover:bg-orange-600"}`}
          >
            <ShoppingCartIcon className="h-4 w-4" />
            {isBg ? "В количката" : "Add to cart"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#18b99f]/50 hover:shadow-md sm:flex-row sm:items-center">
      <Link to={`/products/${product.id}`} className="h-28 w-full flex-none overflow-hidden rounded-lg bg-slate-50 sm:h-32 sm:w-32">
        <img src={product.mainImageUrl || "/placeholder-image.jpg"} alt={product.title} className="h-full w-full object-contain" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/products/${product.id}`} className="font-semibold text-slate-950 hover:text-[#18b99f] sm:text-lg">{product.title}</Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description?.replace(/<[^>]+>/g, " ")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold text-slate-950">{formatCurrency(displayPrice)}</span>
          {product.discountedPrice && product.discountedPrice > 0 ? <span className="text-slate-400 line-through">{formatCurrency(product.regularPrice)}</span> : null}
          <span className={product.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>{product.quantity > 0 ? (isBg ? `${product.quantity} бр. налични` : `${product.quantity} available`) : (isBg ? "Няма наличност" : "Out of stock")}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProductActions productId={product.id} showLabels compact />
          <button type="button" onClick={addToCart} disabled={product.quantity === 0} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold text-white ${product.quantity === 0 ? "cursor-not-allowed bg-slate-300" : "bg-orange-500 hover:bg-orange-600"}`}>
            <ShoppingCartIcon className="h-4 w-4" />{isBg ? "В количката" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListRow;
