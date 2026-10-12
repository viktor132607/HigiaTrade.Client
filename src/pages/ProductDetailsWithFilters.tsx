"use client";

import ProductDetails from "./ProductDetails";

// Retain the existing desktop layout and its 288px left column so the
// product image, details and lower sections do not move when filters are hidden.
const ProductDetailsWithFilters = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
    <div className="site-container">
      <div className="flex flex-col gap-5 sm:gap-8 xl:flex-row xl:items-start">
        <div aria-hidden="true" className="hidden w-72 shrink-0 xl:block" />
        <div className="min-w-0 flex-1 [&>main]:bg-transparent [&>main]:px-0 [&>main]:py-0 [&>main>div]:max-w-none">
          <ProductDetails />
        </div>
      </div>
    </div>
  </div>
);

export default ProductDetailsWithFilters;
