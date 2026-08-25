import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductBrandEnhancer from "../../components/admin/ProductBrandEnhancer";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductIncompleteNotice from "../../components/admin/ProductIncompleteNotice";
import ProductNewStatusEnhancer from "../../components/admin/ProductNewStatusEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => (
  <>
    <ProductBrandEnhancer />
    <ProductDescriptionEnhancer />
    <ProductNewStatusEnhancer />
    <ProductStockEnhancer />
    <ProductIncompleteNotice />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
