import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductBrandEnhancer from "../../components/admin/ProductBrandEnhancer";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductNewStatusEnhancer from "../../components/admin/ProductNewStatusEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => (
  <>
    <ProductBrandEnhancer />
    <ProductDescriptionEnhancer />
    <ProductNewStatusEnhancer />
    <ProductStockEnhancer />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
