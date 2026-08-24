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
        const items = await Promise.all(
          productIds.map(async (id) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Products/${id}`);
            return response.ok ? ((await response.json()) as Product) : null;
          })
        );
        setProducts(items.filter((item): item is Product => Boolean(item)));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [productIds]);

  if (productIds.length === 0) {
    return (
      <div className="site-container py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">{isBg ? "Сравнение на продукти" : "Compare products"}</h1>
          <p className="mt-3 text-slate-500">{isBg ? "Добави поне два продукта чрез бутона „Сравни“." : "Add at least two products using the Compare button."}</p>
          <Link to="/products" className="mt-6 inline-flex rounded-md bg-[#18b99f] px-5 py-3 font-semibold text-white hover:bg-[#149f8a]">
            {isBg ? "Към продуктите" : "Browse products"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{isBg ? "Сравнение на продукти" : "Compare products"}</h1>
          <p className="mt-1 text-sm text-slate-500">{isBg ? "До 4 продукта едновременно." : "Compare up to 4 products at once."}</p>
        </div>
        <button onClick={() => dispatch(clearCompare())} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {isBg ? "Изчисти всички" : "Clear all"}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">{isBg ? "Зареждане..." : "Loading..."}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[760px] w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-200 align-top">
                <th className="w-44 bg-slate-50 p-4 text-left text-sm font-semibold text-slate-600">{isBg ? "Продукт" : "Product"}</th>
                {products.map((product) => (
                  <td key={product.id} className="min-w-52 border-l border-slate-200 p-4">
                    <div className="relative">
                      <button
                        onClick={() => dispatch(removeFromCompare(product.id))}
                        className="absolute right-0 top-0 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-600"
                        title={isBg ? "Премахни" : "Remove"}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                      <Link to={`/products/${product.id}`}>
                        <img src={product.mainImageUrl || "/placeholder-image.jpg"} alt={product.title} className="mx-auto h-36 w-36 object-contain" />
                        <div className="mt-3 pr-7 font-semibold text-slate-950 hover:text-[#18b99f]">{product.title}</div>
                      </Link>
                      <div className="mt-3"><ProductActions productId={product.id} showLabels compact /></div>
                    </div>
                  </td>
                ))}
              </tr>

              {[
                { labelBg: "Цена", labelEn: "Price", render: (p: Product) => formatCurrency(p.discountedPrice && p.discountedPrice > 0 ? p.discountedPrice : p.regularPrice) },
                { labelBg: "Редовна цена", labelEn: "Regular price", render: (p: Product) => formatCurrency(p.regularPrice) },
                { labelBg: "Отстъпка", labelEn: "Discount", render: (p: Product) => p.discountPercentage ? `${p.discountPercentage}%` : "—" },
                { labelBg: "Марка", labelEn: "Brand", render: (p: Product) => p.brand || "—" },
                { labelBg: "Категория", labelEn: "Category", render: (p: Product) => p.categoryName || "—" },
                { labelBg: "Рейтинг", labelEn: "Rating", render: (p: Product) => `${(p.rating ?? 0).toFixed(1)} / 5` },
                { labelBg: "Наличност", labelEn: "Stock", render: (p: Product) => p.quantity > 0 ? (isBg ? `${p.quantity} бр.` : `${p.quantity} pcs`) : (isBg ? "Няма наличност" : "Out of stock") },
                { labelBg: "ДДС", labelEn: "VAT", render: (p: Product) => p.vatRate != null ? `${p.vatRate}%` : "—" },
                { labelBg: "Описание", labelEn: "Description", render: (p: Product) => p.description?.replace(/<[^>]+>/g, " ").trim() || "—" },
              ].map((row) => (
                <tr key={row.labelBg} className="border-b border-slate-200 last:border-b-0 align-top">
                  <th className="bg-slate-50 p-4 text-left text-sm font-semibold text-slate-600">{isBg ? row.labelBg : row.labelEn}</th>
                  {products.map((product) => (
                    <td key={product.id} className="border-l border-slate-200 p-4 text-sm text-slate-700">{row.render(product)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Compare;
