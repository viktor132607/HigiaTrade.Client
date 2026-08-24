import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductBrandEnhancer from "../../components/admin/ProductBrandEnhancer";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => (
  <>
    <ProductBrandEnhancer />
    <ProductDescriptionEnhancer />
    <ProductStockEnhancer />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
