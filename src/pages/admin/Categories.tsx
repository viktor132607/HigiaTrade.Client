import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Category {
  id: string;
  name: string;
  productCount: number;
  imageURI: string;
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    imageURI: ''
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("We could not load categories.");
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("We could not load categories.");
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Category name is required.";
    } else if (formData.name.length < 2) {
      errors.name = "Use at least 2 characters.";
    } else if (formData.name.length > 50) {
      errors.name = "Use 50 characters or fewer.";
    } else if (categories.some(cat =>
      cat.name.toLowerCase() === formData.name.toLowerCase() &&
      cat.id !== editingCategory?.id
    )) {
      errors.name = "A category with this name already exists.";
    }

    if (!formData.imageURI.trim()) {
      errors.imageURI = "Category image URL is required.";
    } else {
      try {
        new URL(formData.imageURI);
      } catch {
        errors.imageURI = "Enter a valid URL.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', imageURI: '' });
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/Categories/`;

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingCategory?.id,
          name: formData.name,
          imageURI: formData.imageURI
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "We could not save the category.");
      }

      await fetchCategories();
      closeEditModal();
    } catch (err) {
      console.error("Error saving category:", err);
      setError(err instanceof Error ? err.message : "We could not save the category.");
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', imageURI: '' });
    setError('');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      imageURI: category.imageURI || ''
    });
    setError('');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("We could not delete the category.");
      }

      await fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("We could not delete the category.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage categories</h1>
        <button
          onClick={handleAddCategory}
          className="flex items-center rounded-md bg-[#18b99f] px-4 py-2 text-white transition-colors hover:bg-[#149f8a]"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add category
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="table-scroll">
          <table className="min-w-[28rem] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditCategory(category)}
                        className="flex-none rounded-md focus:outline-none focus:ring-2 focus:ring-[#18b99f] focus:ring-offset-2"
                        title="Edit category"
                        aria-label={`Edit ${category.name}`}
                      >
                        {category.imageURI ? (
                          <img
                            src={category.imageURI}
                            alt={category.name}
                            className="h-12 w-12 rounded-md border border-gray-200 object-cover transition hover:opacity-80"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md border border-gray-200 bg-gray-100 transition hover:bg-gray-200" />
                        )}
                      </button>
                      <span>{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-white bg-yellow-600 hover:bg-yellow-700 p-1.5 rounded-md mr-2"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded-md"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? "Edit category" : "Add category"}
            </h2>
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    validationErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageURI"
                  value={formData.imageURI}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md bg-white text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    validationErrors.imageURI ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.imageURI && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.imageURI}</p>
                )}
                {formData.imageURI.trim() && !validationErrors.imageURI && (
                  <div className="mt-3 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                    <img
                      src={formData.imageURI}
                      alt={formData.name ? `${formData.name} preview` : 'Category preview'}
                      className="h-44 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#18b99f] px-4 py-2 text-white hover:bg-[#149f8a]"
                >
                  {editingCategory ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete category</h2>
            <p className="mb-6 text-gray-600">
              Delete the category "{categoryToDelete?.name}"?
              {categoryToDelete && categoryToDelete.productCount > 0 && (
                <span className="block mt-2 text-red-600">
                  This category still contains {categoryToDelete.productCount} product{categoryToDelete.productCount === 1 ? "" : "s"}.
                </span>
              )}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
