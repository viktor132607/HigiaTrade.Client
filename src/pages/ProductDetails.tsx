"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { StarIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { RootState } from "../store";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import ProductActions from "../components/products/ProductActions";
import ProductCard from "../components/products/ProductCard";

type ProductImage = { id: string | null; uri: string };
type Product = { id:string; title:string; description:string; regularPrice:number; mainImageUrl:string; secondaryImages?:ProductImage[]; categoryId:string; categoryName?:string; brand?:string; quantity:number; rating?:number; discountPercentage?:number; discountedPrice?:number; isNewProduct?:boolean; };
type ReviewItem = { id:string; content:string; rating:number; createdOn:string; userId:string; userNames:string; };

const VIEW_HISTORY_KEY = "higiatrade_recently_viewed_products";
const MAX_VIEW_HISTORY = 12;

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const tr = (bg:string,en:string)=>(isBg?bg:en);
  const [product,setProduct]=useState<Product|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [selectedImage,setSelectedImage]=useState(0);
  const [quantity,setQuantity]=useState(1);
  const [reviews,setReviews]=useState<ReviewItem[]>([]);
  const [similarProducts,setSimilarProducts]=useState<Product[]>([]);
  const [recentlyViewed,setRecentlyViewed]=useState<Product[]>([]);
  const [reviewRating,setReviewRating]=useState(0);
  const [reviewText,setReviewText]=useState("");
  const [sendingReview,setSendingReview]=useState(false);

  const resolveProductId=async(routeValue:string)=>{if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeValue))return routeValue;const tokenPart=routeValue.match(/-([0-9a-f]{8})$/i)?.[1]?.toLowerCase();if(!tokenPart)return routeValue;const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);if(!r.ok)return routeValue;const d=await r.json();const list=Array.isArray(d)?d:Array.isArray(d?.items)?d.items:[];return list.find((p:Product)=>String(p.id).replace(/-/g,"").toLowerCase().startsWith(tokenPart))?.id??routeValue;};
  useEffect(()=>{if(!id)return;let cancelled=false;(async()=>{try{setLoading(true);setError(null);const realId=await resolveProductId(id);const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${realId}`);if(!response.ok)throw new Error(tr("Продуктът не можа да бъде зареден.","We could not load this product."));const data=await response.json() as Product;if(!cancelled){setProduct(data);setQuantity(1);setSelectedImage(0);}}catch(e){if(!cancelled)setError(e instanceof Error?e.message:tr("Продуктът не можа да бъде зареден.","We could not load this product."));}finally{if(!cancelled)setLoading(false);}})();return()=>{cancelled=true;};},[id,language]);

  const loadReviews=async(productId:string)=>{try{const q=new URLSearchParams({ProductId:productId,PageNumber:"1",PageSize:"20",SortBy:"createdOn",SortDescending:"true"});const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews?${q}`);if(!r.ok)return;const d=await r.json();setReviews(Array.isArray(d.items)?d.items:[]);}catch{}};
  useEffect(()=>{if(product?.id)void loadReviews(product.id);},[product?.id]);

  useEffect(()=>{
    if(!product?.id)return;
    try{
      const stored=JSON.parse(localStorage.getItem(VIEW_HISTORY_KEY)||"[]");
      const ids=Array.isArray(stored)?stored.filter((x):x is string=>typeof x==="string"):[];
      const next=[product.id,...ids.filter(x=>x!==product.id)].slice(0,MAX_VIEW_HISTORY);
      localStorage.setItem(VIEW_HISTORY_KEY,JSON.stringify(next));
    }catch{}
  },[product?.id]);

  useEffect(()=>{if(!product?.id||!product.categoryId){setSimilarProducts([]);setRecentlyViewed([]);return;}let cancelled=false;(async()=>{try{const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`);if(!r.ok)return;const d=await r.json();const list:Product[]=Array.isArray(d)?d:Array.isArray(d?.items)?d.items:[];const sameCategory=list.filter(p=>p.id!==product.id&&p.categoryId===product.categoryId);const fallback=list.filter(p=>p.id!==product.id&&p.categoryId!==product.categoryId);if(!cancelled)setSimilarProducts([...sameCategory,...fallback].slice(0,4));
      try{const stored=JSON.parse(localStorage.getItem(VIEW_HISTORY_KEY)||"[]");const ids:string[]=Array.isArray(stored)?stored.filter((x):x is string=>typeof x==="string"):[];const map=new Map(list.map(p=>[p.id,p]));const history=ids.filter(x=>x!==product.id).map(x=>map.get(x)).filter((x):x is Product=>Boolean(x)).slice(0,4);if(!cancelled)setRecentlyViewed(history);}catch{if(!cancelled)setRecentlyViewed([]);}
    }catch{if(!cancelled){setSimilarProducts([]);setRecentlyViewed([]);}}})();return()=>{cancelled=true;};},[product?.id,product?.categoryId]);

  const addToCart=async()=>{if(!product)return;if(!token){toast.error(tr("Влез в профила си, за да добавиш продукта в количката.","Sign in to add this product to your cart."));return;}try{const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({productId:product.id,quantity})});if(!r.ok)throw 0;toast.success(tr("Продуктът е добавен в количката.","Product added to cart."));}catch{toast.error(tr("Продуктът не можа да бъде добавен в количката.","We could not add this product to your cart."));}};

  const submitReview=async()=>{if(!product||!token||reviewRating<1)return;try{setSendingReview(true);const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reviews`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({productId:product.id,rating:reviewRating,content:reviewText.trim()||null})});const payload=await r.json().catch(()=>null);if(!r.ok)throw new Error(payload?.message||tr("Можеш да оставиш ревю само след потвърдена покупка на този продукт.","You can review this product only after a confirmed purchase."));setReviewRating(0);setReviewText("");await loadReviews(product.id);toast.success(tr("Оценката е добавена.","Review added."));}catch(e){toast.error(e instanceof Error?e.message:tr("Ревюто не можа да бъде добавено.","Review could not be added."));}finally{setSendingReview(false);}};

  if(loading)return <div className="flex min-h-[55vh] items-center justify-center"><div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#18b99f]"/></div>;
  if(error||!product)return <div className="flex min-h-[55vh] items-center justify-center px-4 text-center text-red-600">{error||tr("Продуктът не е намерен.","Product not found.")}</div>;
  const images=[product.mainImageUrl,...(product.secondaryImages??[]).map(x=>x.uri)].filter(Boolean);
  const displayPrice=product.discountedPrice&&product.discountedPrice>0?product.discountedPrice:product.regularPrice;
  const rating=Number(product.rating??0);

  return <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-10">
      <section><div className="relative aspect-square overflow-hidden rounded-[2rem] border bg-white"><img src={images[selectedImage]||"/placeholder-image.jpg"} alt={product.title} className="h-full w-full object-contain p-6"/></div></section>
      <section className="rounded-[2rem] border bg-white p-6 lg:p-8"><div className="text-xs font-semibold uppercase text-slate-500">{product.brand}{product.categoryName?` • ${product.categoryName}`:""}</div><h1 className="mt-3 text-4xl font-bold">{product.title}</h1><div className="mt-4 flex">{[1,2,3,4,5].map(s=><StarIcon key={s} className={`h-5 w-5 ${s<=Math.round(rating)?"text-yellow-400":"text-slate-200"}`}/>)}</div><div className="mt-6 text-3xl font-black">{formatCurrency(displayPrice)}</div><div className="mt-6 border-y py-4"><strong className={product.quantity>0?"text-emerald-700":"text-rose-600"}>{product.quantity>0?tr("В наличност","In stock"):tr("Няма наличност","Out of stock")}</strong> · {product.quantity} {tr("бр.","pcs")}</div><div className="prose prose-sm mt-6" dangerouslySetInnerHTML={{__html:product.description||""}}/>{product.quantity>0&&<div className="mt-6 flex items-center gap-3"><button onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><input type="number" min={1} max={product.quantity} value={quantity} onChange={e=>setQuantity(Math.min(product.quantity,Math.max(1,Number(e.target.value)||1)))} className="w-20 rounded border p-2 text-center"/><button onClick={()=>setQuantity(Math.min(product.quantity,quantity+1))}>+</button></div>}<button onClick={()=>void addToCart()} disabled={product.quantity<=0} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-40">{tr("Добави в количката","Add to cart")}</button><ProductActions productId={product.id} showLabels /></section>
    </div>

    {similarProducts.length>0&&<section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-2xl font-black text-slate-950">{tr("Подобни продукти","Similar products")}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similarProducts.map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}

    {recentlyViewed.length>0&&<section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-2xl font-black text-slate-950">{tr("Последно разглеждани","Recently viewed")}</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentlyViewed.map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}

    <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="text-2xl font-black text-slate-950">{tr("Оценки и ревюта","Ratings & reviews")}</h2>
      {token ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="font-bold">{tr("Оцени продукта","Rate this product")}</div><div className="mt-3 flex gap-1">{[1,2,3,4,5].map(star=><button key={star} type="button" onClick={()=>setReviewRating(star)} className="p-1" aria-label={`${star}`}><StarIcon className={`h-8 w-8 ${star<=reviewRating?"text-yellow-400":"text-slate-300"}`}/></button>)}</div><textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder={tr("Текст по желание","Optional comment")} className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-[#18b99f]"/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{tr("Ревю може да остави само профил с потвърдена поръчка за този продукт.","Only an account with a confirmed order for this product can review it.")}</span><button type="button" disabled={reviewRating<1||sendingReview} onClick={()=>void submitReview()} className="rounded-xl bg-[#18b99f] px-5 py-2.5 font-bold text-white disabled:opacity-40">{sendingReview?tr("Изпращане...","Submitting..."):tr("Публикувай","Publish")}</button></div></div> : <p className="mt-4 text-sm text-slate-600">{tr("Влез в профила си, за да оставиш оценка след потвърдена покупка.","Sign in to leave a rating after a confirmed purchase.")}</p>}
      <div className="mt-6 space-y-3">{reviews.length===0?<p className="text-sm text-slate-500">{tr("Все още няма ревюта.","No reviews yet.")}</p>:reviews.map(review=><article key={review.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><strong>{review.userNames}</strong><div className="flex">{[1,2,3,4,5].map(s=><StarIcon key={s} className={`h-4 w-4 ${s<=review.rating?"text-yellow-400":"text-slate-200"}`}/>)}</div></div>{review.content?.trim()?<p className="mt-2 text-sm text-slate-700">{review.content}</p>:null}</article>)}</div>
    </section>
  </div></main>;
};
export default ProductDetails;
