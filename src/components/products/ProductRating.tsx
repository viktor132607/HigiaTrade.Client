import { StarIcon } from "@heroicons/react/24/solid";

type ProductRatingProps = {
  rating?: number | null;
  className?: string;
};

/** No rating means no stars or score. Otherwise show all five stars, including grey unfilled portions. */
const ProductRating = ({ rating, className = "" }: ProductRatingProps) => {
  const numericRating = Number(rating);
  if (rating == null || !Number.isFinite(numericRating) || numericRating <= 0) return null;

  const score = Math.round(Math.min(numericRating, 5) * 10) / 10;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`Rating: ${score.toFixed(1)} out of 5 stars`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, score - index)) * 100;
          return (
            <span key={index} className="relative inline-block h-3.5 w-3.5 shrink-0">
              <StarIcon className="absolute inset-0 h-3.5 w-3.5 text-slate-300 dark:text-slate-500" />
              {fill > 0 && (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill}%` }}>
                  <StarIcon className="h-3.5 w-3.5 max-w-none text-amber-500" />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200" aria-hidden="true">
        {score.toFixed(1)}
      </span>
    </div>
  );
};

export default ProductRating;
