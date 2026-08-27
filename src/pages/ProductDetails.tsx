"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { RootState } from "../store";
import { addItem } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/currency";
import { brandSeoPath } from "../utils/seo";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_LINK } from "../config/contact";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import ProductActions from "../components/products/ProductActions";
import ProductCard from "../components/products/ProductCard";

type ProductImage = { id: string | null; uri: string };
type Product = {
  id: string;
  title: string;
  description: string;
  regularPrice: number;
  mainImageUrl: string;
  secondaryImages?: ProductImage[];
  categoryId: string;
  categoryName?: string;
  brand?: string;
  quantity: number;
  rating?: number;
  discountPercentage?: number;
  discountedPrice?: number;
  wholesalePrice?: number;
  wholesalePriceInclVat?: number;
  wholesalePriceExclVat?: number;
  wholesaleMinQuantity?: number;
  isNewProduct?: boolean;
};

type ReviewItem = {
  id: string;
  content: string;
  rating: number;
  createdOn: string;
  userId: string;
  userNames: string;
};

const VIEW_HISTORY_KEY = "higiatrade_recently_viewed_products";
const MAX_VIEW_HISTORY = 12;

const extractPackageSize = (product: Product) => {
  const plainDescription = String(product.description || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const source = `${plainDescription} ${product.title}`;
  const unit = "(?:мл|ml|л|l|кг|kg|гр?|g|бр\\.?|pcs?)";
  const labelled = source.match(new RegExp(`(?:опаковка(?:та)?(?:\\s+от)?|разфасовка|package(?:\\s+size)?|pack(?:\\s+size)?)\\s*[:\\-]?\\s*(\\d+(?:[.,]\\d+)?\\s*${unit})`, "i"));
  if (labelled?.[1]) return labelled[1].replace(/\s+/g, " ").trim();
  const generic = source.match(new RegExp(`(\\d+(?:[.,]\\d+)?\\s*${unit})`, "i"));
  return generic?.[1]?.replace(/\s+/g, " ").trim() || "";
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const tr = (bg: string, en: string) => (isBg ? bg : en);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  const resolveProductId = async (routeValue: string) => {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeValue)) return routeValue;
    const tokenPart = routeValue.match(/-([0-9a-f]{8})$/i)?.[1]?.toLowerCase();
    if (!tokenPart) return routeValue;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);
    if (!response.ok) return routeValue;
    const data = await response.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return list.find((item: Product) => String(item.id).replace(/-/g, "").toLowerCase().startsWith(tokenPart))?.id ?? routeValue;
  };

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const realId = await resolveProductId(id);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${realId}`);
        if (!response.ok) throw new Error(tr("Продуктът не можа да бъде зареден.", "We could not load this product."));
        const data = (await response.json()) as Product;
        if (!cancelled) {
          setProduct(data);
          setQuantity(1);
          setSelectedImage(0);
          setGalleryOpen(false);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : tr("Продуктът не можа да бъде зареден.", "We could not load this product."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, language]);

  const loadReviews = async (productId: string) => {
    try {
      const query = new URLSearchParams({ ProductId: productId, PageNumber: "1", PageSize: "20", SortBy: "createdOn", SortDescending: "true" });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews?${query}`);
      if (!response.ok) return;
      const data = await response.json();
      setReviews(Array.isArray(data.items) ? data.items : []);
    } catch {}
  };

  useEffect(() => {
    if (product?.id) void loadReviews(product.id);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    try {
      const stored = JSON.parse(localStorage.getItem(VIEW_HISTORY_KEY) || "[]");
      const ids = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
      localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify([product.id, ...ids.filter((item) => item !== product.id)].slice(0, MAX_VIEW_HISTORY)));
    } catch {}
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id || !product.categoryId) {
      setSimilarProducts([]);
      setRecentlyViewed([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);
        if (!response.ok) return;
        const data = await response.json();
        const list: Product[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const sameCategory = list.filter((item) => item.id !== product.id && item.categoryId === product.categoryId);
        const fallback = list.filter((item) => item.id !== product.id && item.categoryId !== product.categoryId);
        if (!cancelled) setSimilarProducts([...sameCategory, ...fallback].slice(0, 4));

        try {
          const stored = JSON.parse(localStorage.getItem(VIEW_HISTORY_KEY) || "[]");
          const ids: string[] = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
          const map = new Map(list.map((item) => [item.id, item]));
          const history = ids.filter((item) => item !== product.id).map((item) => map.get(item)).filter((item): item is Product => Boolean(item)).slice(0, 4);
          if (!cancelled) setRecentlyViewed(history);
        } catch {
          if (!cancelled) setRecentlyViewed([]);
        }
      } catch {
        if (!cancelled) {
          setSimilarProducts([]);
          setRecentlyViewed([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.categoryId]);

  useEffect(() => {
    if (!galleryOpen) return;
    const imageCount = Array.from(new Set([product?.mainImageUrl, ...(product?.secondaryImages ?? []).map((item) => item.uri)].filter(Boolean))).length;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key === "ArrowLeft" && imageCount > 1) setSelectedImage((index) => (index === 0 ? imageCount - 1 : index - 1));
      if (event.key === "ArrowRight" && imageCount > 1) setSelectedImage((index) => (index === imageCount - 1 ? 0 : index + 1));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryOpen, product?.mainImageUrl, product?.secondaryImages]);

  const cartItem = () => {
    if (!product) return null;
    return {
      id: product.id,
      title: product.title,
      regularPrice: product.regularPrice,
      quantity,
      imageUrl: product.mainImageUrl,
      mainImageUrl: product.mainImageUrl,
      discountPercentage: product.discountPercentage,
      discountedPrice: product.discountedPrice,
    };
  };

  const addToCart = async () => {
    if (!product || product.quantity <= 0) return;
    try {
      const item = cartItem();
      if (!item) return;
      dispatch(addItem(item));
      toast.success(tr("Продуктът е добавен в количката.", "Product added to cart."));
      if (token) {
        void fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, quantity }),
        }).catch(() => undefined);
      }
    } catch {
      toast.error(tr("Продуктът не беше добавен в количката.", "The product was not added to your cart."));
    }
  };

  const buyNow = async () => {
    if (!product || product.quantity <= 0) return;
    try {
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, quantity }),
        });
        if (!response.ok) throw new Error("Unable to add product to cart.");
      }

      const item = cartItem();
      if (!item) return;
      dispatch(addItem(item));
      navigate("/checkout");
    } catch {
      toast.error(tr("Покупката не можа да бъде започната.", "We could not start checkout."));
    }
  };

  const submitReview = async () => {
    if (!product || !token || reviewRating < 1) return;
    try {
      setSendingReview(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, rating: reviewRating, content: reviewText.trim() || null }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || tr("Можеш да оставиш ревю само след потвърдена покупка на този продукт.", "You can review this product only after a confirmed purchase."));
      setReviewRating(0);
      setReviewText("");
      await loadReviews(product.id);
      toast.success(tr("Оценката е добавена.", "Review added."));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("Ревюто не можа да бъде добавено.", "Review could not be added."));
    } finally {
      setSendingReview(false);
    }
  };

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>;
  if (error || !product) return <div className="flex min-h-[55vh] items-center justify-center px-4 text-center text-red-600">{error || tr("Продуктът не е намерен.", "Product not found.")}</div>;

  const images = Array.from(new Set([product.mainImageUrl, ...(product.secondaryImages ?? []).map((item) => item.uri)].filter(Boolean)));
  const promoActive = Number(product.discountedPrice ?? 0) > 0 && Number(product.discountedPrice) < Number(product.regularPrice);
  const displayPrice = promoActive ? Number(product.discountedPrice) : product.regularPrice;
  const discountPercent = Number(product.discountPercentage ?? 0) > 0
    ? Number(product.discountPercentage)
    : promoActive && product.regularPrice > 0
      ? (1 - displayPrice / product.regularPrice) * 100
      : 0;
  const rating = Number(product.rating ?? 0);
  const packageSize = extractPackageSize(product);
  const previousImage = () => setSelectedImage((index) => (index === 0 ? images.length - 1 : index - 1));
  const nextImage = () => setSelectedImage((index) => (index === images.length - 1 ? 0 : index + 1));
  const openWholesaleInquiry = () => {
    const subject = tr(`Запитване за цени на едро: ${product.title}`, `Wholesale price inquiry: ${product.title}`);
    navigate(`/contact?subject=${encodeURIComponent(subject)}`);
  };
  const openDeliveryInquiry = () => {
    const subject = tr(`Доставка: ${product.title}`, `Delivery: ${product.title}`);
    navigate(`/contact?subject=${encodeURIComponent(subject)}`);
  };
  const imageErrorFallback = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith("/higiqlogo.png")) image.src = "/higiqlogo.png";
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-[1020px]">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,520px)] lg:gap-6">
          <section className="w-full max-w-[460px]">
            <div className="flex items-start gap-3">
              {images.length > 1 && (
                <div className="flex max-h-[380px] w-16 shrink-0 flex-col gap-2 overflow-y-auto pr-1 sm:w-[68px]">
                  {images.map((image, index) => (
                    <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition ${selectedImage === index ? "border-[#18b99f]" : "border-slate-200 hover:border-slate-400"}`}>
                      <img src={image} alt={`${product.title} ${index + 1}`} onError={imageErrorFallback} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setGalleryOpen(true)} className="relative block aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left" aria-label={tr("Отвори галерията", "Open gallery")}>
                <img src={images[selectedImage] || "/higiqlogo.png"} alt={product.title} onError={imageErrorFallback} className="h-full w-full object-cover transition duration-200 hover:scale-[1.015]" />
              </button>
            </div>
          </section>

          <section className="flex h-fit min-h-[532px] flex-col rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
              {product.categoryName && (
                <span>
                  {tr("Категория", "Category")}: {" "}
                  <button type="button" onClick={() => navigate(`/category/${product.categoryId}`)} className="font-semibold text-[#00aebe] hover:underline">
                    {product.categoryName}
                  </button>
                </span>
              )}
              {product.brand && (
                <span>
                  {tr("Производител", "Manufacturer")}: {" "}
                  <button type="button" onClick={() => navigate(brandSeoPath(product.brand!))} className="font-semibold text-[#00aebe] hover:underline">
                    {product.brand}
                  </button>
                </span>
              )}
              <button type="button" onClick={openDeliveryInquiry} className="font-semibold text-[#00aebe] hover:underline">
                {tr("Доставка", "Delivery")}
              </button>
            </div>

            <h1 className="mt-2 text-3xl font-bold leading-tight">{product.title}</h1>
            <div className="mt-2 flex">{[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} className={`h-4 w-4 ${star <= Math.round(rating) ? "text-yellow-400" : "text-slate-200"}`} />)}</div>

            <div className="mt-4 border-b border-slate-200 pb-3">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                {promoActive && <span className="text-sm font-semibold text-slate-400 line-through">{formatCurrency(product.regularPrice)}</span>}
                <span className={`text-2xl font-black leading-none ${promoActive ? "text-rose-600" : "text-slate-950"}`}>{formatCurrency(displayPrice)}</span>
                {promoActive && <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600">{tr(`Промоция -${Math.round(discountPercent)}%`, `Promotion -${Math.round(discountPercent)}%`)}</span>}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {tr("Минималната стойност на поръчката е 50 €. За цени на едро, моля използвайте ", "The minimum order value is €50. For wholesale pricing, please use the ")}
                <button type="button" onClick={openWholesaleInquiry} className="font-semibold text-[#00aebe] hover:underline">
                  {tr("контактната форма", "contact form")}
                </button>
                {tr(" или се обадете на ", " or call ")}
                <a href={`tel:${CONTACT_PHONE_LINK}`} className="font-semibold text-[#00aebe] hover:underline">
                  {CONTACT_PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
              <strong className={`inline-flex items-center gap-2 text-sm ${product.quantity > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {product.quantity > 0 ? <><CheckCircleIcon className="h-5 w-5" />{tr("В наличност", "In stock")}</> : tr("Изчерпан продукт", "Out of stock")}
              </strong>
              {packageSize && (
                <span className="text-xs font-semibold text-slate-500">
                  {tr("Разфасовка", "Pack size")}: <span className="font-black text-slate-800">{packageSize}</span>
                </span>
              )}
            </div>

            {product.quantity > 0 && (
              <div className="mt-4 flex items-center gap-2.5">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-lg">−</button>
                <input type="number" min={1} max={product.quantity} value={quantity} onChange={(event) => setQuantity(Math.min(product.quantity, Math.max(1, Number(event.target.value) || 1)))} className="h-9 w-20 rounded-md border border-slate-300 p-2 text-center" />
                <button type="button" onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-lg">+</button>
              </div>
            )}

            <div className="mt-auto pt-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => void addToCart()} disabled={product.quantity <= 0} className="rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-40">
                  {product.quantity > 0 ? tr("Добави в количката", "Add to cart") : tr("Изчерпан продукт", "Unavailable")}
                </button>
                <button onClick={() => void buyNow()} disabled={product.quantity <= 0} className="rounded-xl bg-[#18b99f] px-4 py-3 font-bold text-white transition hover:bg-[#149f8a] disabled:opacity-40">
                  {product.quantity > 0 ? tr("Купи", "Buy now") : tr("Изчерпан", "Unavailable")}
                </button>
              </div>
              <ProductActions productId={product.id} showLabels />
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">{tr("Описание", "Description")}</h2>
          <div className="mt-4 text-sm leading-6 text-slate-700 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_p]:my-2.5 [&_ul]:my-2.5 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:my-2.5 [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:my-1" dangerouslySetInnerHTML={{ __html: product.description || "" }} />
        </section>

        {similarProducts.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-black text-slate-950">{tr("Подобни продукти", "Similar products")}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similarProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </section>
        )}

        {recentlyViewed.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-2xl font-black text-slate-950">{tr("Последно разглеждани", "Recently viewed")}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentlyViewed.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-2xl font-black text-slate-950">{tr("Оценки и ревюта", "Ratings & reviews")}</h2>
          {token ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-bold">{tr("Оцени продукта", "Rate this product")}</div>
              <div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1" aria-label={`${star}`}><StarIcon className={`h-8 w-8 ${star <= reviewRating ? "text-yellow-400" : "text-slate-300"}`} /></button>)}</div>
              <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder={tr("Текст по желание", "Optional comment")} className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-[#18b99f]" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{tr("Ревю може да остави само профил с потвърдена поръчка за този продукт.", "Only an account with a confirmed order for this product can review it.")}</span>
                <button type="button" disabled={reviewRating < 1 || sendingReview} onClick={() => void submitReview()} className="rounded-xl bg-[#18b99f] px-5 py-2.5 font-bold text-white disabled:opacity-40">{sendingReview ? tr("Изпращане...", "Submitting...") : tr("Публикувай", "Publish")}</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">{tr("Влез в профила си, за да оставиш оценка след потвърдена покупка.", "Sign in to leave a rating after a confirmed purchase.")}</p>
          )}

          <div className="mt-6 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">{tr("Все още няма ревюта.", "No reviews yet.")}</p>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{review.userNames}</strong>
                    <div className="flex">{[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} className={`h-4 w-4 ${star <= review.rating ? "text-yellow-400" : "text-slate-200"}`} />)}</div>
                  </div>
                  {review.content?.trim() ? <p className="mt-2 text-sm text-slate-700">{review.content}</p> : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setGalleryOpen(false)} role="dialog" aria-modal="true">
          <button type="button" onClick={(event) => { event.stopPropagation(); setGalleryOpen(false); }} className="absolute right-5 top-5 z-30 rounded-full bg-black/50 p-3 text-white hover:bg-black/70" aria-label={tr("Затвори", "Close")}><XMarkIcon className="h-7 w-7" /></button>
          {images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); previousImage(); }} className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70" aria-label={tr("Предишна снимка", "Previous image")}><ChevronLeftIcon className="h-8 w-8" /></button>}
          <img src={images[selectedImage] || "/higiqlogo.png"} alt={product.title} onError={imageErrorFallback} onClick={(event) => event.stopPropagation()} className="max-h-[86vh] max-w-[86vw] object-contain" />
          {images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70" aria-label={tr("Следваща снимка", "Next image")}><ChevronRightIcon className="h-8 w-8" /></button>}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-30 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-black/55 p-2" onClick={(event) => event.stopPropagation()}>
              {images.map((image, index) => <button key={`${image}-modal-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImage === index ? "border-[#18b99f]" : "border-white/30"}`}><img src={image} alt={`${product.title} ${index + 1}`} onError={imageErrorFallback} className="h-full w-full object-cover" /></button>)}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ProductDetails;