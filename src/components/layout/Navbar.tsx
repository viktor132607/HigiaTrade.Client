import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowsRightLeftIcon,
  Bars3Icon,
  HeartIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PhoneIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SunIcon,
  TagIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { decodeJWT } from "../../utils/jwtUtils";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";
import { CONTACT_EMAILS, CONTACT_PHONE_COMPACT } from "../../config/contact";

const CONTACT_PHONE = CONTACT_PHONE_COMPACT;
const CONTACT_EMAIL = CONTACT_EMAILS[0];

const menuItems = [
  { key: "promotions", to: "/promotions", labelBg: "Промоции", labelEn: "Promotions", badgeBg: "Акция", badgeEn: "Sale", icon: TagIcon },
  { key: "new", to: "/new-products", labelBg: "Нови стоки", labelEn: "New products", badgeBg: "Ново", badgeEn: "New", icon: SparklesIcon },
  { key: "top", to: "/best-sellers", labelBg: "Най-продавани", labelEn: "Best sellers", badgeBg: "ТОП", badgeEn: "TOP", icon: SparklesIcon },
  { key: "brands", to: "/brands", labelBg: "По марка", labelEn: "By brand", badgeBg: null, badgeEn: null, icon: null },
  { key: "contact", to: "/contact", labelBg: "Контакти", labelEn: "Contact", badgeBg: null, badgeEn: null, icon: PhoneIcon },
] as const;

interface NavCategory { id: string; name: string; nameBg?: string; nameEn?: string; }
type NavProduct = { discountPercentage?: number; discountedPrice?: number; regularPrice?: number; isNewProduct?: boolean; rating?: number; };

const normalizeCategories = (data: unknown): NavCategory[] => {
  const items = Array.isArray(data) ? data : data && typeof data === "object" && "items" in data && Array.isArray((data as { items?: unknown }).items) ? (data as { items: unknown[] }).items : [];
  return items.map((item) => { const value=item as Record<string,unknown>; return {id:String(value.id??""),name:String(value.name??value.title??""),nameBg:value.nameBg?String(value.nameBg):undefined,nameEn:value.nameEn?String(value.nameEn):undefined}; }).filter(c=>c.id&&c.name);
};

const normalizeProducts = (data: unknown): NavProduct[] => {
  if (Array.isArray(data)) return data as NavProduct[];
  if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items?: unknown }).items)) return (data as { items: NavProduct[] }).items;
  return [];
};

const Navbar=()=>{
 const dispatch=useDispatch(); const navigate=useNavigate(); const location=useLocation();
 const [isMenuOpen,setIsMenuOpen]=useState(false); const [searchQuery,setSearchQuery]=useState(""); const [categories,setCategories]=useState<NavCategory[]>([]);
 const [activeBadges,setActiveBadges]=useState({promotions:false,new:false,top:false});
 const {isAuthenticated,token}=useSelector((state:RootState)=>state.auth); const wishlistCount=useSelector((state:RootState)=>state.user.wishlist?.length??0); const cartCount=useSelector((state:RootState)=>state.cart.items.reduce((t,i)=>t+i.quantity,0));
 const {language,theme,t,toggleLanguage,toggleTheme}=useLanguageTheme(); const compareCount=0; const isBg=language==="bg";
 useEffect(()=>{(async()=>{try{const [categoriesResponse,productsResponse]=await Promise.all([fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`),fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products?PageNumber=1&PageSize=500`)]);setCategories(categoriesResponse.ok?normalizeCategories(await categoriesResponse.json()):[]);if(productsResponse.ok){const products=normalizeProducts(await productsResponse.json());setActiveBadges({promotions:products.some(p=>Number(p.discountPercentage??0)>0||(Number(p.discountedPrice??0)>0&&Number(p.discountedPrice)<Number(p.regularPrice??0))),new:products.some(p=>p.isNewProduct===true),top:products.some(p=>Number(p.rating??0)>=4.5)});}else setActiveBadges({promotions:false,new:false,top:false});}catch{setCategories([]);setActiveBadges({promotions:false,new:false,top:false});}})();},[]);
 useEffect(()=>setIsMenuOpen(false),[location.pathname,location.search]);
 const isAdmin=useMemo(()=>decodeJWT(token)?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]==="Admin",[token]);
 const handleLogout=async()=>{try{await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/logout`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});}catch{}finally{dispatch(logout());navigate("/");}};
 const handleSearchSubmit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const q=searchQuery.trim();navigate(`/products${q?`?search=${encodeURIComponent(q)}`:""}`);setIsMenuOpen(false);};
 const categoryLabel=(c:NavCategory)=>isBg?c.nameBg??c.name:c.nameEn??c.name;
 const sortedCategories=useMemo(()=>[...categories].sort((a,b)=>categoryLabel(a).localeCompare(categoryLabel(b),isBg?"bg":"en",{sensitivity:"base"})),[categories,isBg]);
 const shouldShowBadge=(key:string)=>key==="promotions"?activeBadges.promotions:key==="new"?activeBadges.new:key==="top"?activeBadges.top:false;
 const actions=<><button onClick={toggleLanguage} className="rounded-full border border-[#d6dde3] px-3 py-2 text-sm text-[#70808d]">{isBg?"EN":"BG"}</button><button onClick={toggleTheme} className="inline-flex h-10 items-center rounded-full border border-[#d6dde3] px-3 text-[#70808d]">{theme==="dark"?<SunIcon className="h-5 w-5"/>:<MoonIcon className="h-5 w-5"/>}</button><button className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border"><ArrowsRightLeftIcon className="h-6 w-6"/><span className="absolute -right-1 -top-1 rounded-full bg-[#7b8187] px-1 text-xs text-white">{compareCount}</span></button><Link to="/wishlist" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border"><HeartIcon className="h-6 w-6"/><span className="absolute -right-1 -top-1 rounded-full bg-[#7b8187] px-1 text-xs text-white">{wishlistCount}</span></Link><Link to="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border"><ShoppingBagIcon className="h-7 w-7"/><span className="absolute -right-1 -top-1 rounded-full bg-[#7b8187] px-1 text-xs text-white">{cartCount}</span></Link>{isAuthenticated?<><Link to="/profile"><UserCircleIcon className="h-9 w-9 text-[#70808d]"/></Link><button onClick={handleLogout} className="bg-[#263b4d] px-4 py-2 text-sm text-white">{t("nav.signOut")}</button></>:<Link to="/login"><UserCircleIcon className="h-9 w-9 text-[#70808d]"/></Link>}</>;
 return <header className="sticky top-0 z-40 bg-white shadow-sm dark:bg-black"><div className="site-container flex items-center gap-3 py-3"><button onClick={()=>setIsMenuOpen(v=>!v)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center border xl:hidden">{isMenuOpen?<XMarkIcon className="h-5 w-5"/>:<Bars3Icon className="h-5 w-5"/>}</button><Link to="/" className="shrink-0"><img src="/higiqlogo.png" alt="HygiaTrade" className="h-12 w-auto"/></Link><form onSubmit={handleSearchSubmit} className="hidden flex-1 xl:block"><div className="relative mx-auto max-w-2xl"><input type="search" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={t("nav.searchPlaceholder")} className="h-12 w-full border bg-[#f3f3f3] px-4 pr-14"/><button className="absolute right-0 top-0 flex h-12 w-14 items-center justify-center bg-[#18b99f] text-white"><MagnifyingGlassIcon className="h-6 w-6"/></button></div></form><div className="hidden shrink-0 items-center gap-3 2xl:flex"><PhoneIcon className="h-8 w-8 text-[#70808d]"/><div><p className="text-sm font-bold text-[#7a8791]">{CONTACT_PHONE}</p><p className="text-xs font-bold uppercase text-[#263b4d]">{isBg?"Свържете се с нас":"Contact us"}</p><p className="text-[11px] text-[#7a8791]">{CONTACT_EMAIL}</p></div></div><div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">{actions}</div><div className="ml-auto md:hidden"><Link to="/cart" className="relative inline-flex h-11 w-11 items-center justify-center"><ShoppingBagIcon className="h-7 w-7"/><span className="absolute right-0 top-0 rounded-full bg-[#7b8187] px-1 text-xs text-white">{cartCount}</span></Link></div></div><div className="hidden bg-[#263b4d] text-white xl:block"><div className="site-container flex items-center"><div className="group relative"><button onClick={()=>navigate("/products")} className="flex h-12 items-center gap-2 bg-[#18b99f] px-5 font-bold"><Bars3Icon className="h-6 w-6"/>{isBg?"Категории":"Categories"}</button><div className="invisible absolute left-0 top-full z-50 w-64 bg-white p-2 text-black opacity-0 group-hover:visible group-hover:opacity-100">{sortedCategories.map(c=><button key={c.id} onClick={()=>navigate(`/products?category=${encodeURIComponent(c.id)}`)} className="block w-full px-4 py-2 text-left">{categoryLabel(c)}</button>)}</div></div><nav className="flex flex-1 items-center">{menuItems.map(item=><NavLink key={item.to} to={item.to} className="flex h-12 items-center gap-2 px-5 text-sm font-bold">{item.icon&&<item.icon className="h-4 w-4"/>}{isBg?item.labelBg:item.labelEn}{item.badgeBg&&shouldShowBadge(item.key)&&<span className="rounded bg-red-500 px-1 text-[10px]">{isBg?item.badgeBg:item.badgeEn}</span>}</NavLink>)}{isAdmin&&<NavLink to="/admin" className="px-5 text-sm font-bold">Админ</NavLink>}</nav></div></div>{isMenuOpen&&<div className="border-t bg-white p-4 xl:hidden dark:bg-black"><form onSubmit={handleSearchSubmit}><div className="relative"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full border p-3 pr-12 dark:bg-black" placeholder={t("nav.searchPlaceholder")}/><button className="absolute right-0 top-0 flex h-full w-12 items-center justify-center bg-[#18b99f] text-white"><MagnifyingGlassIcon className="h-5 w-5"/></button></div></form><div className="mt-4 grid gap-2"><Link to="/products" className="p-2 font-bold">{isBg?"Категории":"Categories"}</Link>{menuItems.map(i=><Link key={i.to} to={i.to} className="p-2">{isBg?i.labelBg:i.labelEn}</Link>)}{isAdmin&&<Link to="/admin" className="p-2 font-bold">Админ</Link>}</div><div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4 md:hidden">{actions}</div></div>}</header>;
};
export default Navbar;
