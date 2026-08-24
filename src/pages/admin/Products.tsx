import React from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";

const AdminProducts = () => (
  <>
    <ProductDescriptionEnhancer />
    <AdminProductsLegacy />
  </>
);

export default AdminProducts;
