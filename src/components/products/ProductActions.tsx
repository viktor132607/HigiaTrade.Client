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
    ? "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap break-normal rounded-md border px-2.5 text-xs font-medium transition"
    : "flex h-10 w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap break-normal rounded-lg border px-2 text-xs font-semibold transition sm:h-11 sm:gap-2 sm:px-3 sm:text-sm";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-2.5"}>
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
        <ArrowsRightLeftIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
        {showLabels ? <span className="hidden whitespace-nowrap break-normal sm:inline">{isBg ? (isCompared ? "Добавен" : "Сравни") : isCompared ? "Added" : "Compare"}</span> : null}
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
          <HeartSolidIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
        ) : (
          <HeartIcon className={`${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />
        )}
        {showLabels ? <span className="hidden whitespace-nowrap break-normal sm:inline">{isBg ? "Любими" : "Wishlist"}</span> : null}
      </button>
    </div>
  );
};

export default ProductActions;
