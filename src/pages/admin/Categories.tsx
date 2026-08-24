import { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { API_BASE_URL, readApiJson } from '../../config/api';
import { RootState } from '../../store';

interface Category {
  id: string;
  name: string;
  productCount: number;
  imageURI: string;
}

interface CategoryApiItem {
  id: string;
  name: string;
  productCount?: number;
  imageURI?: string;
  imageUri?: string;
}

interface FormData {
  name: string;
  imageURI: string;
}

interface ValidationErrors {
  name?: string;
  imageURI?: string;
}

const AdminCategories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', imageURI: '' });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { token } = useSelector((state: RootState) => state.auth);

  const fetchCategories = async () => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/Categories`, { cache: 'no-store' });
      const data = await readApiJson<CategoryApiItem[]>(response);

      setCategories(
        Array.isArray(data)
          ? data.map((category) => ({
              id: category.id,
              name: category.name,
              productCount: category.productCount ?? 0,
              imageURI: category.imageURI ?? category.imageUri ?? '',
            }))
          : [],
      );
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
      setError(err instanceof Error ? err.message : 'We could not load categories.');
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required.';
    } else if (formData.name.length < 2) {
      errors.name = 'Use at least 2 characters.';
    } else if (formData.name.length > 50) {
      errors.name = 'Use 50 characters or fewer.';
    } else if (
      categories.some(
        (category) =>
          category.name.toLowerCase() === formData.name.toLowerCase() &&
          category.id !== editingCategory?.id,
      )
    ) {
      errors.name = 'A category with this name already exists.';
    }

    if (!formData.imageURI.trim()) {
      errors.imageURI = 'Category image URL is required.';
    } else {
      try {
        new URL(formData.imageURI);
      } catch {
        errors.imageURI = 'Enter a valid URL.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: undefined }));
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', imageURI: '' });
    setValidationErrors({});
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, imageURI: category.imageURI });
    setError('');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', imageURI: '' });
    setError('');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: editingCategory?.id,
          name: formData.name.trim(),
          imageURI: formData.imageURI.trim(),
        }),
      });

      await readApiJson(response);
      await fetchCategories();
      closeEditModal();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'We could not save the category.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/Categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      await readApiJson(response);
      await fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'We could not delete the category.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage categories</h1>
        <button
          type="button"
          onClick={handleAddCategory}
          className="flex items-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition-colors hover:bg-[#149f8a]"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add category
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="table-scroll">
          <table className="min-w-[28rem] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(category)}
                        className="flex-none rounded-md focus:outline-none focus:ring-2 focus:ring-[#18b99f] focus:ring-offset-2"
                        title="Edit category"
                      >
                        {category.imageURI ? (
                          <img
                            src={category.imageURI}
                            alt={category.name}
                            className="h-12 w-12 rounded-md border border-gray-200 object-cover transition hover:opacity-80"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md border border-gray-200 bg-gray-100" />
                        )}
                      </button>
                      <span>{category.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      className="mr-2 rounded-md bg-yellow-600 p-1.5 text-white hover:bg-yellow-700"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setIsDeleteModalOpen(true);
                      }}
                      className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 text-gray-900">
            <h2 className="mb-4 text-xl font-bold">{editingCategory ? 'Edit category' : 'Add category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm ${validationErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                />
                {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="url"
                  name="imageURI"
                  value={formData.imageURI}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm ${validationErrors.imageURI ? 'border-red-300' : 'border-gray-300'}`}
                />
                {validationErrors.imageURI && <p className="mt-1 text-sm text-red-600">{validationErrors.imageURI}</p>}
                {formData.imageURI.trim() && !validationErrors.imageURI && (
                  <div className="mt-3 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    <img src={formData.imageURI} alt={`${formData.name || 'Category'} preview`} className="h-44 w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeEditModal} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a]">{editingCategory ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDeleteModalOpen(false);
              setCategoryToDelete(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Delete category</h2>
            <p className="mb-6 text-gray-600">Delete the category "{categoryToDelete?.name}"?</p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
