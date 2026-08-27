from pathlib import Path

path = Path('src/components/admin/AdminProductsLegacy.tsx')
text = path.read_text(encoding='utf-8')

anchor = '''const getInitialPageSize = () => {
  if (typeof window === "undefined") return PAGE_SIZE_OPTIONS[0];

  const saved = Number(window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(saved) ? saved : PAGE_SIZE_OPTIONS[0];
};
'''
helper = anchor + '''
const getApiErrorMessage = (payload: unknown, status: number) => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["message", "Message", "detail", "Detail", "title", "Title"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }

    const errorSource = record.errors ?? record.Errors;
    if (errorSource && typeof errorSource === "object") {
      const messages: string[] = [];
      for (const [field, value] of Object.entries(errorSource as Record<string, unknown>)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string" && item.trim()) messages.push(`${field}: ${item.trim()}`);
            else if (item && typeof item === "object") {
              const itemRecord = item as Record<string, unknown>;
              const message = itemRecord.errorMessage ?? itemRecord.ErrorMessage ?? itemRecord.message ?? itemRecord.Message;
              if (typeof message === "string" && message.trim()) messages.push(`${field}: ${message.trim()}`);
            }
          }
        } else if (typeof value === "string" && value.trim()) {
          messages.push(`${field}: ${value.trim()}`);
        }
      }
      if (messages.length) return messages.join(" ");
    }
  }

  return `Продуктът не можа да бъде запазен (HTTP ${status}).`;
};
'''
if anchor not in text:
    raise SystemExit('initial page size anchor not found')
text = text.replace(anchor, helper, 1)

old_edit = '''  const handleEditProduct = (product: Product) => {
    const category = categories.find((item) => item.id === product.categoryId);

    setEditingProduct(product);
    setFormData({
      name: product.title || "",
      description: product.description || "",
      categoryId: product.categoryId || "",
      regularPrice: (product.regularPrice || 0).toString(),
      discountedPrice: (product.discountedPrice || 0).toString(),
      stock: (product.quantity || 0).toString(),
      discountPercentage: (product.discountPercentage || 0).toString(),
      mainImageUrl: product.mainImageUrl || "",
      secondaryImages: product.secondaryImages?.length > 0 ? product.secondaryImages : [],
      isActive: product.isActive !== false,
    });
    setCategorySearch(category?.name || product.categoryName || "");
    setValidationErrors({});
    setIsCategoryMenuOpen(false);
    setCategoryCreateError("");
    setIsModalOpen(true);
  };
'''
new_edit = '''  const handleEditProduct = (product: Product) => {
    const categoryById = categories.find((item) => item.id === product.categoryId);
    const categoryByName = product.categoryName
      ? categories.find(
          (item) =>
            item.name.trim().toLocaleLowerCase("bg-BG") ===
            product.categoryName?.trim().toLocaleLowerCase("bg-BG")
        )
      : undefined;
    const resolvedCategory = categoryById ?? categoryByName;

    setEditingProduct(product);
    setFormData({
      name: product.title || "",
      description: product.description || "",
      categoryId: resolvedCategory?.id || "",
      regularPrice: (product.regularPrice || 0).toString(),
      discountedPrice: (product.discountedPrice || 0).toString(),
      stock: (product.quantity || 0).toString(),
      discountPercentage: (product.discountPercentage || 0).toString(),
      mainImageUrl: product.mainImageUrl || "",
      secondaryImages: product.secondaryImages?.length > 0 ? product.secondaryImages : [],
      isActive: product.isActive !== false,
    });
    setCategorySearch(resolvedCategory?.name || product.categoryName || "");
    setValidationErrors(
      resolvedCategory
        ? {}
        : { categoryId: "Старата категория на продукта вече не съществува. Избери актуална категория." }
    );
    setIsCategoryMenuOpen(false);
    setCategoryCreateError("");
    setIsModalOpen(true);

    if (!categoryById && categoryByName) {
      toast.info(`Категорията „${product.categoryName}“ беше свързана към актуалния запис.`);
    } else if (!resolvedCategory && product.categoryName) {
      toast.error(`Категорията „${product.categoryName}“ вече не съществува. Избери нова категория преди запис.`);
    }
  };
'''
if old_edit not in text:
    raise SystemExit('edit handler anchor not found')
text = text.replace(old_edit, new_edit, 1)

old_validation_end = '''    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
'''
new_validation_end = '''    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(`Не може да се запази: ${Object.values(errors).filter(Boolean).join(" ")}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
'''
if old_validation_end not in text:
    raise SystemExit('validation anchor not found')
text = text.replace(old_validation_end, new_validation_end, 1)

old_discount = '      discountPercentage: Number.parseFloat(formData.discountPercentage) || 0,\n'
new_discount = '      discountPercentage: Math.min(100, Math.max(0, Math.round(Number.parseFloat(formData.discountPercentage) || 0))),\n'
if old_discount not in text:
    raise SystemExit('discount payload anchor not found')
text = text.replace(old_discount, new_discount, 1)

old_error = '''      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Продуктът не можа да бъде запазен.");
      }
'''
new_error = '''      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null);
        throw new Error(getApiErrorMessage(errorData, response.status));
      }
'''
if old_error not in text:
    raise SystemExit('save error anchor not found')
text = text.replace(old_error, new_error, 1)

path.write_text(text, encoding='utf-8')
