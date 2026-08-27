import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { clearCompare, removeFromCompare } from "../store/slices/compareSlice";
import { Product } from "../types";
import { formatCurrency } from "../utils/currency";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";
import ProductActions from "../components/products/ProductActions";

const Compare = () => {
  const dispatch = useDispatch();
  const productIds = useSelector((state: RootState) => state.compare.items);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const items = await Promise.all(productIds.map(async (id) => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${id}`);
          return response.ok ? ((await response.json()) as Product) : null;
        }));
        setProducts(items.filter((item): item is Product => Boolean(item)));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [productIds]);

  const rows = [
    { labelBg: "Цена", labelEn: "Price", render: (p: Product) => formatCurrency(p.discountedPrice && p.discountedPrice > 0 ? p.discountedPrice : p.regularPrice) },
    { labelBg: "Редовна цена", labelEn: "Regular price", render: (p: Product) => formatCurrency(p.regularPrice) },
    { labelBg: "Отстъпка", labelEn: "Discount", render: (p: Product) => p.discountPercentage ? `${p.discountPercentage}%` : "—" },
    { labelBg: "Марка", labelEn: "Brand", render: (p: Product) => p.brand || "—" },
    { labelBg: "Категория", labelEn: "Category", render: (p: Product) => p.categoryName || "—" },
    { labelBg: "Рейтинг", labelEn: "Rating", render: (p: Product) => `${(p.rating ?? 0).toFixed(1)} / 5` },
    { labelBg: "Наличност", labelEn: "Stock", render: (p: Product) => p.quantity > 0 ? (isBg ? `${p.quantity} бр.` : `${p.quantity} pcs`) : (isBg ? "Няма наличност" : "Out of stock") },
    { labelBg: "ДДС", labelEn: "VAT", render: (p: Product) => p.vatRate != null ? `${p.vatRate}%` : "—" },
    { labelBg: "Описание", labelEn: "Description", render: (p: Product) => p.description?.replace(/<[^>]+>/g, " ").trim() || "—" },
  ];

  if (productIds.length === 0) {
    return (
      <div className="site-container py-8 sm:py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold text-slate-950">{isBg ? "Сравнение на продукти" : "Compare products"}</h1>
          <p className="mt-3 text-slate-500">{isBg ? "Добави поне два продукта чрез бутона „Сравни“." : "Add at least two products using the Compare button."}</p>
          <Link to="/products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[#18b99f] px-5 py-3 font-semibold text-white hover:bg-[#149f8a]">{isBg ? "Към продуктите" : "Browse products"}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{isBg ? "Сравнение на продукти" : "Compare products"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isBg ? "До 4 продукта едновременно." : "Compare up to 4 products at once."}</p>
        </div>
        <button type="button" onClick={() => dispatch(clearCompare())} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{isBg ? "Изчисти всички" : "Clear all"}</button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">{isBg ? "Зареждане..." : "Loading..."}</div>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative p-4">
                  <button type="button" onClick={() => dispatch(removeFromCompare(product.id))} className="absolute right-3 top-3 z-10 flex min-h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm" title={isBg ? "Премахни" : "Remove"}><XMarkIcon className="h-4 w-4" /></button>
                  <Link to={`/products/${product.id}`} className="block pr-12">
                    <img src={product.mainImageUrl || "/higiqlogo.png"} alt={product.title} className="mx-auto h-44 w-full object-contain" />
                    <h2 className="mt-3 text-base font-semibold text-slate-950">{product.title}</h2>
                  </Link>
                  <div className="mt-3"><ProductActions productId={product.id} showLabels compact /></div>
                </div>
                <dl className="divide-y divide-slate-100 border-t border-slate-200">
                  {rows.map((row) => (
                    <div key={row.labelBg} className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.2fr)] gap-3 px-4 py-3 text-sm">
                      <dt className="font-medium text-slate-500">{isBg ? row.labelBg : row.labelEn}</dt>
                      <dd className="break-words text-right text-slate-800">{row.render(product)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-[760px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-200 align-top">
                  <th className="w-44 bg-slate-50 p-4 text-left text-sm font-semibold text-slate-600">{isBg ? "Продукт" : "Product"}</th>
                  {products.map((product) => (
                    <td key={product.id} className="min-w-52 border-l border-slate-200 p-4">
                      <div className="relative">
                        <button type="button" onClick={() => dispatch(removeFromCompare(product.id))} className="absolute right-0 top-0 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-600" title={isBg ? "Премахни" : "Remove"}><XMarkIcon className="h-4 w-4" /></button>
                        <Link to={`/products/${product.id}`}><img src={product.mainImageUrl || "/higiqlogo.png"} alt={product.title} className="mx-auto h-36 w-36 object-contain" /><div className="mt-3 pr-7 font-semibold text-slate-950 hover:text-[#18b99f]">{product.title}</div></Link>
                        <div className="mt-3"><ProductActions productId={product.id} showLabels compact /></div>
                      </div>
                    </td>
                  ))}
                </tr>
                {rows.map((row) => (
                  <tr key={row.labelBg} className="border-b border-slate-200 align-top last:border-b-0">
                    <th className="bg-slate-50 p-4 text-left text-sm font-semibold text-slate-600">{isBg ? row.labelBg : row.labelEn}</th>
                    {products.map((product) => <td key={product.id} className="border-l border-slate-200 p-4 text-sm text-slate-700">{row.render(product)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Compare;
