import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductAvailabilitySortEnhancer from "../../components/admin/ProductAvailabilitySortEnhancer";
import ProductBrandEnhancer from "../../components/admin/ProductBrandEnhancer";
import ProductCategoryHierarchyEnhancer from "../../components/admin/ProductCategoryHierarchyEnhancer";
import ProductDefaultImagePreviewEnhancer from "../../components/admin/ProductDefaultImagePreviewEnhancer";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductIncompleteNotice from "../../components/admin/ProductIncompleteNotice";
import ProductNewStatusEnhancer from "../../components/admin/ProductNewStatusEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => (
  <>
    <ProductAvailabilitySortEnhancer />
    <ProductBrandEnhancer />
    <ProductDefaultImagePreviewEnhancer />
    <ProductCategoryHierarchyEnhancer />
    <ProductDescriptionEnhancer />
    <ProductNewStatusEnhancer />
    <ProductStockEnhancer />
    <ProductIncompleteNotice />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
