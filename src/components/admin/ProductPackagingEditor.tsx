import type { ProductPackagingOption } from "../../types/packaging";

interface Props {
  value: ProductPackagingOption[];
  onChange: (next: ProductPackagingOption[]) => void;
  retailPrice: number;
  baseStock: number;
}

const ProductPackagingEditor = ({ value, onChange, retailPrice, baseStock }: Props) => {
  const update = (index: number, patch: Partial<ProductPackagingOption>) =>
    onChange(value.map((option, pos) => pos === index ? { ...option, ...patch } : option));

  return (
    <section className="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
      <div>
        <h3 className="text-base font-bold">Разфасовки и кашони</h3>
        <p className="text-xs text-slate-600">Всяка разфасовка има собствена цена и наличност. Стандартната използва основната цена и наличност на продукта. Новите варианти са без наличност.</p>
      </div>
      {value.map((option, index) => (
        <div key={option.id || index} className="grid grid-cols-2 gap-2 rounded-lg border bg-white p-3 sm:grid-cols-[minmax(0,1.5fr)_90px_130px_110px_auto] sm:items-end">
          <label className="col-span-2 text-xs font-medium sm:col-span-1">
            Разфасовка {option.isDefault ? "(основна)" : ""}
            <input aria-label={`Име на разфасовка ${index + 1}`} required maxLength={100} value={option.label}
              onChange={e => update(index, { label: e.target.value })} className="mt-1 w-full rounded-md border px-2 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Брой единици
            <input aria-label={`Единици ${index + 1}`} required type="number" min={1} max={10000} step={1} value={option.unitsPerPackage}
              onChange={e => update(index, { unitsPerPackage: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-2 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium">
            Цена € с ДДС
            <input aria-label={`Цена на разфасовка ${index + 1}`} required type="number" min={0} max={1000000} step="0.01"
              disabled={option.isDefault} value={option.isDefault ? retailPrice : option.priceInclVat}
              onChange={e => update(index, { priceInclVat: Number(e.target.value) })} className="mt-1 w-full rounded-md border px-2 py-2 text-sm disabled:bg-slate-100" />
          </label>
          <label className="text-xs font-medium">
            Наличност
            <input aria-label={`Наличност на разфасовка ${index + 1}`} required type="number" min={0} max={100000000} step={1}
              disabled={option.isDefault} value={option.isDefault ? baseStock : option.stockQuantity}
              onChange={e => update(index, { stockQuantity: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full rounded-md border px-2 py-2 text-sm disabled:bg-slate-100" />
          </label>
          {!option.isDefault && (
            <button type="button" className="col-span-2 rounded-md border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-700 sm:col-span-1"
              onClick={() => onChange(value.filter((_, i) => i !== index))}>Изтрий</button>
          )}
        </div>
      ))}
      <button type="button" className="rounded-md border border-teal-600 px-3 py-2 text-sm font-semibold text-teal-700"
        onClick={() => onChange([...value, { label: "", unitsPerPackage: 1, priceInclVat: 0, stockQuantity: 0, isDefault: false }])}>
        + Добави разфасовка
      </button>
    </section>
  );
};

export default ProductPackagingEditor;
