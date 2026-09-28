import React, { useState } from "react";
import AdminProductsLegacy from "../../components/admin/AdminProductsLegacy";
import ProductAvailabilitySortEnhancer from "../../components/admin/ProductAvailabilitySortEnhancer";
import ProductBrandEnhancer from "../../components/admin/ProductBrandEnhancer";
import ProductCategoryHierarchyEnhancer from "../../components/admin/ProductCategoryHierarchyEnhancer";
import ProductDefaultImagePreviewEnhancer from "../../components/admin/ProductDefaultImagePreviewEnhancer";
import ProductDescriptionEnhancer from "../../components/admin/ProductDescriptionEnhancer";
import ProductExcelImport from "../../components/admin/ProductExcelImport";
import ProductIncompleteNotice from "../../components/admin/ProductIncompleteNotice";
import ProductNewStatusEnhancer from "../../components/admin/ProductNewStatusEnhancer";
import ProductStockEnhancer from "../../components/admin/ProductStockEnhancer";

const AdminProducts = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <ProductAvailabilitySortEnhancer />
      <ProductBrandEnhancer />
      <ProductDefaultImagePreviewEnhancer />
      <ProductCategoryHierarchyEnhancer />
      <ProductDescriptionEnhancer />
      <ProductNewStatusEnhancer />
      <ProductStockEnhancer />
      <ProductIncompleteNotice />
      <ProductExcelImport
        onImported={() => setRefreshKey((value) => value + 1)}
      />
      <AdminProductsLegacy key={refreshKey} />
    </>
  );
};

export default AdminProducts;
