import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface User {
  id: string;
  names: string;
  email: string;
  role: string;
  phone: string;
}

interface ValidationErrors {
  names?: string;
  email?: string;
  phone?: string;
  newPassword?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [editFormData, setEditFormData] = useState({
    names: '',
    email: '',
    phone: '',
    newPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("We could not load customers.");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("We could not load customers.");
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      names: user.names,
      email: user.email,
      phone: user.phone || '',
      newPassword: ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!editFormData.names.trim()) {
      errors.names = "Customer name is required.";
    } else if (editFormData.names.length < 2) {
      errors.names = "Use at least 2 characters.";
    } else if (editFormData.names.length > 50) {
      errors.names = "Use 50 characters or fewer.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(editFormData.email)) {
      errors.email = "Enter a valid email address.";
    } else if (users.some(user =>
      user.email.toLowerCase() === editFormData.email.toLowerCase() &&
      user.id !== selectedUser?.id
    )) {
      errors.email = "A customer with this email already exists.";
    }

    if (editFormData.phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(editFormData.phone.trim())) {
        errors.phone = "Enter a valid 10-digit phone number.";
      }
    }

    if (!selectedUser) {
      if (!editFormData.newPassword) {
        errors.newPassword = "Password is required for new customers.";
      } else if (editFormData.newPassword.length < 6) {
        errors.newPassword = "Use at least 6 characters.";
      } else if (editFormData.newPassword.length > 100) {
        errors.newPassword = "Use 100 characters or fewer.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/Users`;

      const response = await fetch(url, {
        method: selectedUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedUser ? {
          id: selectedUser.id,
          email: editFormData.email,
          names: editFormData.names,
          phone: editFormData.phone,
        } : {
          email: editFormData.email,
          password: editFormData.newPassword,
          names: editFormData.names,
          phone: editFormData.phone,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "We could not save the customer.");
      }

      await fetchUsers();
      setIsModalOpen(false);
      setEditFormData({
        names: '',
        email: '',
        phone: '',
        newPassword: ''
      });
      setValidationErrors({});
      setSelectedUser(null);
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(err instanceof Error ? err.message : "We could not save the customer.");
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("We could not delete the customer.");
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting customer:", err);
      setError("We could not delete the customer.");
    }
  };

  const handleToggleRole = async (userId: string) => {
    try {
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) return;

      const endpoint = currentUser.role === 'Admin'
        ? `${process.env.NEXT_PUBLIC_API_URL}/Users/demote-to-registered-customer`
        : `${process.env.NEXT_PUBLIC_API_URL}/Users/promote-to-admin`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "We could not update the customer role.");
      }

      await fetchUsers();
      if (selectedUser?.id === userId) {
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err) {
      console.error("Error changing role:", err);
      setError(err instanceof Error ? err.message : "We could not update the customer role.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage customers</h1>
        <button
          onClick={() => {
            setSelectedUser(null);
            setEditFormData({
              names: '',
              email: '',
              phone: '',
              newPassword: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:text-gray-900 hover:bg-primary-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add customer
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="table-scroll">
          <table className="min-w-[48rem] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.names}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone || "Not provided"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleRole(user.id)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    } hover:bg-opacity-75 transition-colors`}
                  >
                    {user.role === "Admin" ? "Admin" : "Customer"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      handleViewUser(user);
                    }}
                    className="text-white bg-yellow-600 hover:bg-yellow-700 p-1.5 rounded-md mr-2"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {selectedUser ? "Edit customer" : "Add customer"}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <form onSubmit={handleUpdateUser} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="names"
                    value={editFormData.names}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm ${
                      validationErrors.names ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.names && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.names}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm ${
                      validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0888123456"
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                {!selectedUser && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={editFormData.newPassword}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm ${
                        validationErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">{validationErrors.newPassword}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedUser(null);
                      setEditFormData({
                        names: '',
                        email: '',
                        phone: '',
                        newPassword: ''
                      });
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-500 text-white rounded-md hover:text-gray-900 hover:bg-primary-600 text-xs sm:text-sm"
                  >
                    {selectedUser ? "Save" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Delete customer</h2>
            <p className="mb-4 sm:mb-6 text-gray-600 text-xs sm:text-sm">
              Delete the customer "{selectedUser.names}"?
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs sm:text-sm"
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

export default AdminUsers;
