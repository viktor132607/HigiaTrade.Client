import { Link } from "react-router-dom";
import { ArrowsRightLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { clearCompare } from "../../store/slices/compareSlice";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const CompareTray = () => {
  const dispatch = useDispatch();
  const count = useSelector((state: RootState) => state.compare.items.length);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
      <Link to="/compare" className="flex min-h-11 items-center gap-2 bg-[#263b4d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#18b99f]">
        <ArrowsRightLeftIcon className="h-5 w-5" />
        {isBg ? `Сравни (${count})` : `Compare (${count})`}
      </Link>
      <button type="button" onClick={() => dispatch(clearCompare())} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-rose-600" title={isBg ? "Изчисти" : "Clear"}>
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CompareTray;
