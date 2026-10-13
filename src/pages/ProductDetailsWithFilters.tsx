"use client";

import ProductDetails from "./ProductDetails";

// Product details have no sidebar; keep the entire page centered on every screen.
const ProductDetailsWithFilters = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-5 sm:py-8 lg:py-10">
    <div className="site-container">
      <div className="[&>main]:bg-transparent [&>main]:px-0 [&>main]:py-0">
        <ProductDetails />
      </div>
    </div>
  </div>
);

export default ProductDetailsWithFilters;
