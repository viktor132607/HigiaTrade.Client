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

interface Product { id:string; title:string; description:string; mainImageUrl:string; regularPrice:number; quantity:number; categoryId:string; rating?:number; discountPercentage?:number; discountedPrice?:number; isNewProduct?:boolean; }
interface ProductCardProps { product: Product; }

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const productPath = productSeoPath(product);
  const productImage = seoImageUrl(product.mainImageUrl, product.title);

  const openProduct = () => navigate(productPath);

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

  const displayPrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
  const stockLabel = product.quantity === 0 ? (isBg ? "Изчерпан продукт" : "Out of stock") : (isBg ? "В наличност" : "In stock");

  return <article
    role="link"
    tabIndex={0}
    onClick={openProduct}
    onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openProduct();}}}
    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-60px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#18b99f]"
  >
    <Link to={productPath} onClick={event=>event.stopPropagation()} className="relative block overflow-hidden"><img src={productImage} alt={product.title} width={640} height={640} loading="lazy" decoding="async" className="h-60 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"/><div className="absolute left-4 top-4 flex flex-col items-start gap-2">{product.isNewProduct&&<span className="rounded-full bg-[#18b99f] px-3 py-1 text-xs font-bold uppercase text-white">{isBg?"Ново":"New"}</span>}{product.discountPercentage?<span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">-{product.discountPercentage}%</span>:null}</div><span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${product.quantity===0?"bg-rose-100 text-rose-700":"bg-emerald-100 text-emerald-700"}`}>{stockLabel}</span></Link>
    <div className="flex flex-1 flex-col p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{isBg?"Продукт":"Product"}</p><div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"><StarIcon className="h-3.5 w-3.5"/>{(product.rating??0).toFixed(1)}</div></div><Link to={productPath} onClick={event=>event.stopPropagation()} className="mt-4 line-clamp-2 font-display text-xl font-semibold leading-tight text-slate-950 hover:text-[#18b99f]">{product.title}</Link><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{product.description.replace(/<[^>]+>/g," ")}</p><div className="mt-6 flex items-end justify-between gap-4"><p className="font-display text-2xl font-bold text-slate-950">{formatCurrency(displayPrice)}</p><span className={product.quantity===0?"text-xs font-semibold text-rose-600":"text-xs text-emerald-600"}>{stockLabel}</span></div><div className="mt-5" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><ProductActions productId={product.id} showLabels/></div><button type="button" onClick={event=>{event.stopPropagation();void handleAddToCart();}} disabled={product.quantity===0} className={`mt-3 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${product.quantity===0?"cursor-not-allowed bg-slate-100 text-slate-400":"bg-slate-950 text-white hover:bg-primary-600"}`}><ShoppingBagIcon className="h-5 w-5"/>{product.quantity===0?(isBg?"Изчерпан продукт":"Unavailable"):(isBg?"Добави в количката":"Add to cart")}</button></div>
  </article>;
};
export default ProductCard;
