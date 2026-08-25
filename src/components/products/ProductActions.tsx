import { ArrowsRightLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../../store";
import { addToWishlist, removeFromWishlist } from "../../store/slices/userSlice";
import { MAX_COMPARE_ITEMS, toggleCompare } from "../../store/slices/compareSlice";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

type Props = {
  productId: string;
  showLabels?: boolean;
  compact?: boolean;
};

const ProductActions = ({ productId, showLabels = false, compact = false }: Props) => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state: RootState) => state.user.wishlist);
  const compareItems = useSelector((state: RootState) => state.compare.items);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const isWishlisted = wishlist.includes(productId);
  const isCompared = compareItems.includes(productId);

  const stop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    stop(event);
    dispatch(isWishlisted ? removeFromWishlist(productId) : addToWishlist(productId));
  };

  const handleCompare = (event: React.MouseEvent<HTMLButtonElement>) => {
    stop(event);

    if (!isCompared && compareItems.length >= MAX_COMPARE_ITEMS) {
      toast.info(
        isBg
          ? `Можеш да сравняваш до ${MAX_COMPARE_ITEMS} продукта едновременно.`
          : `You can compare up to ${MAX_COMPARE_ITEMS} products at once.`
      );
      return;
    }

    dispatch(toggleCompare(productId));
  };

  const baseClass = compact
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition"
    : "flex h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "mt-3 grid grid-cols-2 gap-3"}>
      <button
        type="button"
        onClick={handleCompare}
        className={`${baseClass} ${
          isCompared
            ? "border-[#18b99f] bg-[#18b99f]/10 text-[#148f7c]"
            : "border-slate-300 bg-white text-slate-600 hover:border-[#18b99f] hover:text-[#18b99f]"
        }`}
        title={isBg ? "Сравни" : "Compare"}
      >
        <ArrowsRightLeftIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        {showLabels ? (isBg ? (isCompared ? "Добавен" : "Сравни") : isCompared ? "Added" : "Compare") : null}
      </button>

      <button
        type="button"
        onClick={handleWishlist}
        className={`${baseClass} ${
          isWishlisted
            ? "border-rose-300 bg-rose-50 text-rose-600"
            : "border-slate-300 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600"
        }`}
        title={isBg ? "Любими" : "Wishlist"}
      >
        {isWishlisted ? (
          <HeartSolidIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        ) : (
          <HeartIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        )}
        {showLabels ? (isBg ? "Любими" : "Wishlist") : null}
      </button>
    </div>
  );
};

export default ProductActions;
