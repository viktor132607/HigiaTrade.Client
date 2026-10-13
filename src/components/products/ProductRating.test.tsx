import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductRating from "./ProductRating";

const render = (rating?: number | null) => renderToStaticMarkup(<ProductRating rating={rating} />);

describe("ProductRating", () => {
  it("hides the entire rating when there are no reviews", () => {
    for (const rating of [undefined, null, 0, -1, NaN, Infinity]) {
      expect(render(rating)).toBe("");
    }
  });

  it("always renders five stars for rated products with grey remaining stars", () => {
    const oneStar = render(1);
    expect(oneStar).toContain("1.0 out of 5");
    expect(oneStar.match(/text-slate-300/g)).toHaveLength(5);
    expect(oneStar.match(/text-amber-500/g)).toHaveLength(1);

    const fourStars = render(4);
    expect(fourStars).toContain("4.0 out of 5");
    expect(fourStars.match(/text-slate-300/g)).toHaveLength(5);
    expect(fourStars.match(/text-amber-500/g)).toHaveLength(4);

    const fiveStars = render(5);
    expect(fiveStars.match(/text-amber-500/g)).toHaveLength(5);
  });

  it("renders partial star fill for fractional ratings, without any yellow badge", () => {
    const markup = render(3.7);
    expect(markup).toContain("3.7 out of 5");
    expect(markup.match(/text-amber-500/g)).toHaveLength(4);
    expect(markup).toMatch(/width:70/);
    expect(markup).not.toContain("bg-amber-50");
  });
});
