import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingBagIcon, StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { addItem } from "../../store/slices/cartSlice";
import { RootState } from "../../store";
import { formatCurrency } from "../../utils/currency";
import { productSeoPath, seoImageUrl } from "../../utils/seo";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import ProductActions from "./ProductActions";

interface Product { id:string; title:string; description:string; mainImageUrl:string; usesDefaultImage?:boolean; regularPrice:number; quantity:number; categoryId:string; rating?:number; discountPercentage?:number; discountedPrice?:number; isNewProduct?:boolean; }
interface ProductCardProps { product: Product; }

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const productPath = productSeoPath(product);
  const productImage = seoImageUrl(product.mainImageUrl, product.title, product.usesDefaultImage === true);

  const openProduct = () => navigate(productPath);
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith("/higiqlogo.png")) image.src = "/higiqlogo.png";
  };

  const handleAddToCart = async () => {
    if (product.quantity <= 0) return;
    try {
      dispatch(addItem({ id:product.id, title:product.title, regularPrice:product.regularPrice, quantity:1, imageUrl:product.mainImageUrl, mainImageUrl:product.mainImageUrl, discountPercentage:product.discountPercentage, discountedPrice:product.discountedPrice }));
      toast.success(isBg ? "Продуктът е добавен в количката." : "Product added to cart.");

      if (user && token) {
        void fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        }).catch(() => undefined);
      }
    } catch {
      toast.error(isBg ? "Продуктът не е добавен в количката." : "The product was not added to your cart.");
    }
  };

  const promoActive = Number(product.discountedPrice ?? 0) > 0 && Number(product.discountedPrice) < Number(product.regularPrice);
  const displayPrice = promoActive ? Number(product.discountedPrice) : product.regularPrice;
  const discountPercent = Number(product.discountPercentage ?? 0) > 0
    ? Math.round(Number(product.discountPercentage))
    : promoActive && product.regularPrice > 0
      ? Math.round((1 - displayPrice / product.regularPrice) * 100)
      : 0;
  const stockLabel = product.quantity === 0 ? (isBg ? "Изчерпан продукт" : "Out of stock") : (isBg ? "В наличност" : "In stock");

  return <article
    role="link"
    tabIndex={0}
    onClick={openProduct}
    onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openProduct();}}}
    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#18b99f] sm:rounded-[2rem] sm:shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)]"
  >
    <Link to={productPath} onClick={event=>event.stopPropagation()} className="relative block overflow-hidden"><img src={productImage} alt={product.title} width={640} height={640} loading="lazy" decoding="async" onError={handleImageError} className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 min-[430px]:h-44 sm:h-64"/><div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4 sm:gap-2">{product.isNewProduct&&<span className="rounded-full bg-[#18b99f] px-2 py-0.5 text-[10px] font-bold uppercase text-white sm:px-3 sm:py-1 sm:text-xs">{isBg?"Ново":"New"}</span>}{discountPercent>0?<span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white sm:px-3 sm:py-1 sm:text-xs">-{discountPercent}%</span>:null}</div><span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs ${product.quantity===0?"bg-rose-100 text-rose-700":"bg-emerald-100 text-emerald-700"}`}><span className="sm:hidden">{product.quantity===0?(isBg?"Няма":"Out"):(isBg?"Налично":"Stock")}</span><span className="hidden sm:inline">{stockLabel}</span></span></Link>
    <div className="flex flex-1 flex-col p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.24em]">{isBg?"Продукт":"Product"}</p><div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:px-2.5 sm:py-1 sm:text-xs"><StarIcon className="h-3.5 w-3.5"/>{(product.rating??0).toFixed(1)}</div></div>
      <Link to={productPath} onClick={event=>event.stopPropagation()} className="mt-2 min-h-[2.5rem] line-clamp-2 font-display text-sm font-semibold leading-5 text-slate-950 hover:text-[#18b99f] sm:mt-4 sm:min-h-[3.25rem] sm:text-xl sm:leading-tight">{product.title}</Link>

      <div className="mt-auto pt-4 sm:pt-6">
        <div className="flex min-h-[4.25rem] items-end justify-between gap-2 sm:min-h-[4.75rem] sm:gap-4">
          <div className="flex min-h-[4.25rem] min-w-0 flex-col justify-end sm:min-h-[4.75rem]">
            {promoActive?<div className="mb-0.5 text-sm font-semibold text-slate-400 line-through">{formatCurrency(product.regularPrice)}</div>:null}
            <p className={`font-display text-lg font-bold sm:text-2xl ${promoActive?"text-rose-600":"text-slate-950"}`}>{formatCurrency(displayPrice)}</p>
            <div className="mt-1 min-h-4 text-xs font-semibold uppercase tracking-wide text-rose-600">{promoActive?(isBg?"Промо цена":"Promo price"):"\u00a0"}</div>
          </div>
          <span className={`mb-1 hidden shrink-0 text-right text-xs sm:block ${product.quantity===0?"font-semibold text-rose-600":"text-emerald-600"}`}>{stockLabel}</span>
        </div>

        <div className="mt-2" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><ProductActions productId={product.id} showLabels/></div>
        <button type="button" onClick={event=>{event.stopPropagation();void handleAddToCart();}} disabled={product.quantity===0} className={`mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold sm:mt-3 sm:min-h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${product.quantity===0?"cursor-not-allowed bg-slate-100 text-slate-400":"bg-slate-950 text-white hover:bg-primary-600"}`}><ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5"/><span className="sm:hidden">{product.quantity===0?(isBg?"Няма":"Out"):(isBg?"Купи":"Buy")}</span><span className="hidden sm:inline">{product.quantity===0?(isBg?"Изчерпан продукт":"Unavailable"):(isBg?"Добави в количката":"Add to cart")}</span></button>
      </div>
    </div>
  </article>;
};
export default ProductCard;
