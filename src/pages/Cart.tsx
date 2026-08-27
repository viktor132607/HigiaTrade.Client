import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import { removeItem, updateQuantity } from "../store/slices/cartSlice";

interface CartItem { productId:string; singlePrice:number; totalPrice:number; quantity:number; title:string; primaryImageUri:string; }
interface CartResponse { id:string; orderTotalPrice:number; items:CartItem[]; }

const Cart=()=>{
 const navigate=useNavigate(); const dispatch=useDispatch();
 const token=useSelector((state:RootState)=>state.auth.token); const localItems=useSelector((state:RootState)=>state.cart.items);
 const {language}=useLanguageTheme(); const isBg=language==="bg";
 const [serverCart,setServerCart]=useState<CartResponse|null>(null); const [isLoading,setIsLoading]=useState(Boolean(token));
 const guestCart=useMemo<CartResponse>(()=>({id:"guest",items:localItems.map(i=>({productId:i.id,singlePrice:i.discountedPrice&&i.discountedPrice>0?i.discountedPrice:i.regularPrice,totalPrice:(i.discountedPrice&&i.discountedPrice>0?i.discountedPrice:i.regularPrice)*i.quantity,quantity:i.quantity,title:i.title,primaryImageUri:i.mainImageUrl||i.imageUrl})),orderTotalPrice:localItems.reduce((s,i)=>s+(i.discountedPrice&&i.discountedPrice>0?i.discountedPrice:i.regularPrice)*i.quantity,0)}),[localItems]);
 const cart=token?serverCart:guestCart;

 const fetchCartItems=async()=>{if(!token){setIsLoading(false);return;}try{const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok){if(r.status===404){setServerCart(null);return;}throw 0;}setServerCart(await r.json());}catch{toast.error(isBg?"Количката не можа да бъде заредена.":"We could not load your cart.");}finally{setIsLoading(false);}};
 useEffect(()=>{void fetchCartItems();},[token]);

 const handleQuantityChange=async(productId:string,newQuantity:number)=>{if(newQuantity<1)return;if(!token){dispatch(updateQuantity({id:productId,quantity:newQuantity}));return;}const item=serverCart?.items.find(i=>i.productId===productId);if(!item)return;try{const difference=Math.abs(newQuantity-item.quantity);for(let n=0;n<difference;n++){await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders${newQuantity<item.quantity?"/":""}`,{method:newQuantity<item.quantity?"DELETE":"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({productId,quantity:1})});}await fetchCartItems();}catch{toast.error(isBg?"Количеството не можа да бъде обновено.":"Quantity could not be updated.");}};
 const handleRemoveItem=async(productId:string)=>{if(!token){dispatch(removeItem(productId));return;}const item=serverCart?.items.find(i=>i.productId===productId);if(!item)return;try{const r=await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Orders/`,{method:"DELETE",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({productId,quantity:item.quantity})});if(!r.ok)throw 0;await fetchCartItems();}catch{toast.error(isBg?"Продуктът не можа да бъде премахнат.":"We could not remove that item.");}};

 if(isLoading)return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"/></div>;
 if(!cart||cart.items.length===0)return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-3 py-10"><div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-bold">{isBg?"Количката е празна":"Your cart is empty"}</h1><Link to="/products" className="inline-flex min-h-11 items-center rounded-md bg-primary-600 px-4 py-2 text-white">{isBg?"Разгледай продуктите":"Browse products"}</Link></div></div>;

 return <div className="min-h-[calc(100vh-4rem)] px-3 py-6 sm:px-6 sm:py-10 lg:px-8"><div className="mx-auto max-w-7xl"><h1 className="mb-8 text-center text-3xl font-bold">{isBg?"Количка":"Cart"}</h1><div className="overflow-hidden rounded-[2rem] bg-white shadow-xl"><div className="divide-y divide-gray-200">{cart.items.map(item=><div key={item.productId} className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-6 lg:grid-cols-[112px_minmax(0,1fr)_auto] lg:items-center"><Link to={`/products/${item.productId}`}><img src={item.primaryImageUri||"/higiqlogo.png"} alt={item.title} className="h-20 w-20 rounded-xl object-cover sm:h-28 sm:w-28"/></Link><div><Link to={`/products/${item.productId}`} className="hover:text-primary-600"><h2 className="text-sm font-medium sm:text-lg">{item.title}</h2></Link><div className="mt-2 text-primary-600">{formatCurrency(item.singlePrice)} × {item.quantity} = {formatCurrency(item.totalPrice)}</div></div><div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1"><div className="flex items-center rounded-xl border"><button onClick={()=>void handleQuantityChange(item.productId,item.quantity-1)} disabled={item.quantity<=1} className="min-h-11 min-w-11">−</button><span className="px-2">{item.quantity}</span><button onClick={()=>void handleQuantityChange(item.productId,item.quantity+1)} className="min-h-11 min-w-11">+</button></div><button onClick={()=>void handleRemoveItem(item.productId)} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-rose-200 text-rose-600"><XMarkIcon className="h-5 w-5"/></button></div></div>)}</div><div className="bg-gray-50 p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xl font-semibold">{isBg?"Общо за поръчката:":"Order total:"} {formatCurrency(cart.orderTotalPrice)}</p><button onClick={()=>navigate("/checkout")} className="min-h-12 rounded-md bg-primary-600 px-6 py-3 text-white">{token?(isBg?"Към завършване":"Continue to checkout"):(isBg?"Поръчай като гост":"Checkout as guest")}</button></div></div></div></div></div>;
};
export default Cart;
