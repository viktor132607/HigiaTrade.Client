"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { RootState } from "../store";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import ProductActions from "../components/products/ProductActions";
import { decodeJWT } from "../utils/jwtUtils";

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
};

type ReviewItem = {
  id: string;
  content: string;
  rating: number;
  createdOn: string;
  userId: string;
  userNames: string;
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const tr = (bg: string, en: string) => (isBg ? bg : en);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdOn");
  const [sortDescending, setSortDescending] = useState(true);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);
  const pageSize = 5;

  const currentUserId = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJWT(token);
    return decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ?? null;
  }, [token]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${id}`);
        if (!response.ok) throw new Error(tr("Продуктът не можа да бъде зареден.", "We could not load this product."));
        const data = (await response.json()) as Product;
        if (!cancelled) {
          setProduct(data);
          setQuantity(1);
          setSelectedImage(0);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : tr("Продуктът не можа да бъде зареден.", "We could not load this product."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [id, language]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const query = new URLSearchParams({ ProductId: id, PageNumber: String(pageNumber), PageSize: String(pageSize), SortBy: sortBy, SortDescending: String(sortDescending) });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews?${query.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(tr("Отзивите не можаха да бъдат заредени.", "Reviews could not be loaded."));
      const data = await response.json();
      setReviews(Array.isArray(data.items) ? data.items : []);
      setTotalPages(Math.max(1, Math.ceil(Number(data.totalCount ?? 0) / pageSize)));
    } catch (requestError) {
      console.error(requestError);
      toast.error(tr("Отзивите не можаха да бъдат заредени.", "Reviews could not be loaded."));
    }
  };

  useEffect(() => { void fetchReviews(); }, [id, pageNumber, sortBy, sortDescending, token, language]);

  const addToCart = async () => {
    if (!product) return;
    if (!token) {
      toast.error(tr("Влез в профила си, за да добавиш продукта в количката.", "Sign in to add this product to your cart."));
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (!response.ok) throw new Error();
      toast.success(tr("Продуктът е добавен в количката.", "Product added to cart."));
    } catch {
      toast.error(tr("Продуктът не можа да бъде добавен в количката.", "We could not add this product to your cart."));
    }
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !product || !newReviewRating || !newReviewComment.trim()) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, content: newReviewComment.trim(), rating: newReviewRating }),
      });
      if (!response.ok) throw new Error();
      setNewReviewRating(0);
      setNewReviewComment("");
      setPageNumber(1);
      await fetchReviews();
      toast.success(tr("Отзивът е публикуван.", "Your review was published."));
    } catch {
      toast.error(tr("Отзивът не можа да бъде публикуван.", "We could not publish your review."));
    }
  };

  const updateReview = async (reviewId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: reviewId, content: editContent.trim(), rating: editRating }),
      });
      if (!response.ok) throw new Error();
      setEditingReviewId(null);
      await fetchReviews();
      toast.success(tr("Отзивът е обновен.", "Review updated."));
    } catch {
      toast.error(tr("Отзивът не можа да бъде обновен.", "We could not update this review."));
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!token || !window.confirm(tr("Да се изтрие ли този отзив?", "Delete this review?"))) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error();
      await fetchReviews();
      toast.success(tr("Отзивът е изтрит.", "Review deleted."));
    } catch {
      toast.error(tr("Отзивът не можа да бъде изтрит.", "We could not delete this review."));
    }
  };

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]" /></div>;
  if (error || !product) return <div className="flex min-h-[55vh] items-center justify-center px-4 text-center text-red-600">{error || tr("Продуктът не е намерен.", "Product not found.")}</div>;

  const images = [product.mainImageUrl, ...(product.secondaryImages ?? []).map((image) => image.uri)].filter(Boolean);
  const displayPrice = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.regularPrice;
  const rating = Number(product.rating ?? 0);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-10">
          <section className="min-w-0">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-[2rem]">
              <img src={images[selectedImage] || "/placeholder-image.jpg"} alt={product.title} className="h-full w-full object-contain p-3 sm:p-6" />
              {images.length > 1 && (
                <>
                  <button type="button" aria-label={tr("Предишна снимка", "Previous image")} onClick={() => setSelectedImage((value) => (value - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl shadow sm:left-4">‹</button>
                  <button type="button" aria-label={tr("Следваща снимка", "Next image")} onClick={() => setSelectedImage((value) => (value + 1) % images.length)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl shadow sm:right-4">›</button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-6 sm:overflow-visible">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(index)} className={`h-20 w-20 flex-none overflow-hidden rounded-xl border bg-white p-1 sm:h-auto sm:w-auto sm:aspect-square ${selectedImage === index ? "border-[#18b99f] ring-2 ring-[#18b99f]/20" : "border-slate-200"}`}>
                    <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-[2rem] sm:p-6 lg:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {product.brand ? <span>{product.brand}</span> : null}
              {product.categoryName ? <span>• {product.categoryName}</span> : null}
            </div>
            <h1 className="mt-3 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-4xl">{product.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex">{[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} className={`h-5 w-5 ${star <= Math.round(rating) ? "text-yellow-400" : "text-slate-200"}`} />)}</div>
              <span className="text-sm text-slate-600">{rating > 0 ? `${rating.toFixed(1)} / 5` : tr("Все още няма рейтинг", "No rating yet")}</span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-black text-slate-950">{formatCurrency(displayPrice)}</span>
              {product.discountedPrice && product.discountedPrice > 0 ? <span className="text-base text-slate-400 line-through">{formatCurrency(product.regularPrice)}</span> : null}
              {product.discountPercentage ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-sm font-bold text-rose-700">-{product.discountPercentage}%</span> : null}
            </div>

            <div className="mt-6 grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2">
              <div><span className="text-slate-500">{tr("Наличност", "Availability")}: </span><strong className={product.quantity > 0 ? "text-emerald-700" : "text-rose-600"}>{product.quantity > 0 ? tr("В наличност", "In stock") : tr("Няма наличност", "Out of stock")}</strong></div>
              <div><span className="text-slate-500">{tr("Налични бройки", "Units available")}: </span><strong>{product.quantity}</strong></div>
            </div>

            <div className="prose prose-sm mt-6 max-w-none break-words text-slate-600" dangerouslySetInnerHTML={{ __html: product.description || "" }} />

            {product.quantity > 0 && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-slate-700">{tr("Количество", "Quantity")}</span>
                <div className="flex w-fit items-center overflow-hidden rounded-xl border border-slate-300">
                  <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 disabled:opacity-30">−</button>
                  <input aria-label={tr("Количество", "Quantity")} type="number" min={1} max={product.quantity} value={quantity} onChange={(event) => setQuantity(Math.min(product.quantity, Math.max(1, Number(event.target.value) || 1)))} className="h-11 w-16 border-x border-slate-300 text-center outline-none" />
                  <button type="button" disabled={quantity >= product.quantity} onClick={() => setQuantity((value) => Math.min(product.quantity, value + 1))} className="h-11 w-11 disabled:opacity-30">+</button>
                </div>
                <span className="text-xs text-slate-500">{tr(`Максимум ${product.quantity} бр.`, `Maximum ${product.quantity} pcs`)}</span>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button type="button" onClick={() => void addToCart()} disabled={product.quantity === 0} className="min-h-12 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-[#18b99f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                {product.quantity > 0 ? tr("Добави в количката", "Add to cart") : tr("Няма наличност", "Out of stock")}
              </button>
              <ProductActions productId={product.id} showLabels />
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-12 sm:rounded-[2rem] sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#18b99f]">{tr("Мнения", "Feedback")}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{tr("Отзиви от клиенти", "Customer reviews")}</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPageNumber(1); }} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">
                <option value="createdOn">{tr("Най-нови", "Newest")}</option>
                <option value="rating">{tr("Най-висок рейтинг", "Highest rated")}</option>
              </select>
              <button type="button" onClick={() => setSortDescending((value) => !value)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm">{sortDescending ? tr("Низходящо ↓", "Descending ↓") : tr("Възходящо ↑", "Ascending ↑")}</button>
            </div>
          </div>

          {token ? (
            <form onSubmit={submitReview} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">{tr("Напиши отзив", "Write a review")}</h3>
              <div className="mt-4 flex flex-wrap gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setNewReviewRating(star)} aria-label={`${star}`}><StarIcon className={`h-8 w-8 ${star <= newReviewRating ? "text-yellow-400" : "text-slate-300"}`} /></button>)}</div>
              <textarea value={newReviewComment} onChange={(event) => setNewReviewComment(event.target.value)} placeholder={tr("Сподели мнение за продукта...", "Share your experience with this product...")} className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#18b99f]" />
              <button type="submit" disabled={!newReviewRating || !newReviewComment.trim()} className="mt-3 min-h-11 w-full rounded-lg bg-[#18b99f] px-4 py-2 font-semibold text-white disabled:opacity-40 sm:w-auto">{tr("Публикувай отзив", "Publish review")}</button>
            </form>
          ) : (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{tr("Влез в профила си, за да оставиш отзив.", "Sign in to leave a review.")} <Link to="/login" className="font-semibold text-[#18b99f]">{tr("Вход", "Sign in")}</Link></div>
          )}

          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                {editingReviewId === review.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setEditRating(star)}><StarIcon className={`h-6 w-6 ${star <= editRating ? "text-yellow-400" : "text-slate-300"}`} /></button>)}</div>
                    <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm" />
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void updateReview(review.id)} className="rounded-lg bg-[#18b99f] px-4 py-2 text-sm font-semibold text-white">{tr("Запази", "Save")}</button><button type="button" onClick={() => setEditingReviewId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">{tr("Отказ", "Cancel")}</button></div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((star) => <StarIcon key={star} className={`h-4 w-4 ${star <= review.rating ? "text-yellow-400" : "text-slate-200"}`} />)}</div><p className="mt-2 break-words text-sm font-semibold text-slate-900">{review.userNames}</p><p className="text-xs text-slate-500">{new Date(review.createdOn).toLocaleDateString(isBg ? "bg-BG" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}</p></div>
                      {currentUserId === review.userId && <div className="flex gap-2"><button type="button" onClick={() => { setEditingReviewId(review.id); setEditContent(review.content); setEditRating(review.rating); }} className="rounded-lg border border-slate-300 p-2" title={tr("Редактирай", "Edit")}><PencilIcon className="h-4 w-4" /></button><button type="button" onClick={() => void deleteReview(review.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" title={tr("Изтрий", "Delete")}><TrashIcon className="h-4 w-4" /></button></div>}
                    </div>
                    <div className="prose prose-sm mt-4 max-w-none break-words text-slate-700" dangerouslySetInnerHTML={{ __html: review.content }} />
                  </>
                )}
              </article>
            ))}

            {reviews.length === 0 && <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">{tr("Все още няма отзиви за този продукт.", "There are no reviews for this product yet.")}</div>}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button type="button" disabled={pageNumber === 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-30">{tr("Назад", "Previous")}</button>
              <span className="px-2 text-sm text-slate-600">{tr(`Страница ${pageNumber} от ${totalPages}`, `Page ${pageNumber} of ${totalPages}`)}</span>
              <button type="button" disabled={pageNumber === totalPages} onClick={() => setPageNumber((value) => Math.min(totalPages, value + 1))} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-30">{tr("Напред", "Next")}</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProductDetails;
