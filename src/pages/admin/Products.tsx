import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => (
  <>
    <ProductDescriptionEnhancer />
    <ProductStockEnhancer />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
