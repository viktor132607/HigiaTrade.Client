import { useState, useEffect } from 'react';
import { InformationCircleIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface User {
  id: string;
  names: string;
  email: string;
  role: string;
  phone: string;
}

interface AssociatedOrder {
  id: string;
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
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [previewOrders, setPreviewOrders] = useState<AssociatedOrder[]>([]);
  const [previewOrdersLoading, setPreviewOrdersLoading] = useState(false);
  const [previewOrdersError, setPreviewOrdersError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
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
        throw new Error('Клиентите не можаха да бъдат заредени.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Грешка при зареждане на клиентите:', err);
      setError('Клиентите не можаха да бъдат заредени.');
    }
  };

  const handlePreviewUser = async (user: User) => {
    setPreviewUser(user);
    setPreviewOrders([]);
    setPreviewOrdersError('');
    setPreviewOrdersLoading(true);
    setIsPreviewModalOpen(true);

    try {
      const queryParams = new URLSearchParams({
        UserId: user.id,
        PageNumber: '1',
        PageSize: '1000',
        SortBy: 'createdOn',
        SortDescending: 'true'
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Свързаните поръчки не можаха да бъдат заредени.');
      }

      const data = await response.json();
      const orders = Array.isArray(data)
        ? data
        : data && Array.isArray(data.items)
          ? data.items
          : [];

      const uniqueOrders = Array.from(
        new Map(
          orders
            .filter((order: AssociatedOrder) => Boolean(order?.id))
            .map((order: AssociatedOrder) => [order.id, { id: order.id }])
        ).values()
      ) as AssociatedOrder[];

      setPreviewOrders(uniqueOrders);
    } catch (err) {
      console.error('Грешка при зареждане на свързаните поръчки:', err);
      setPreviewOrdersError(
        err instanceof Error ? err.message : 'Свързаните поръчки не можаха да бъдат заредени.'
      );
    } finally {
      setPreviewOrdersLoading(false);
    }
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewUser(null);
    setPreviewOrders([]);
    setPreviewOrdersError('');
    setPreviewOrdersLoading(false);
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
      errors.names = 'Името на клиента е задължително.';
    } else if (editFormData.names.length < 2) {
      errors.names = 'Използвай поне 2 символа.';
    } else if (editFormData.names.length > 50) {
      errors.names = 'Използвай до 50 символа.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim()) {
      errors.email = 'Имейлът е задължителен.';
    } else if (!emailRegex.test(editFormData.email)) {
      errors.email = 'Въведи валиден имейл адрес.';
    } else if (users.some(user =>
      user.email.toLowerCase() === editFormData.email.toLowerCase() &&
      user.id !== selectedUser?.id
    )) {
      errors.email = 'Клиент с този имейл вече съществува.';
    }

    if (editFormData.phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(editFormData.phone.trim())) {
        errors.phone = 'Въведи валиден 10-цифрен телефонен номер.';
      }
    }

    if (!selectedUser) {
      if (!editFormData.newPassword) {
        errors.newPassword = 'Паролата е задължителна при добавяне на нов клиент.';
      } else if (editFormData.newPassword.length < 6) {
        errors.newPassword = 'Използвай поне 6 символа.';
      } else if (editFormData.newPassword.length > 100) {
        errors.newPassword = 'Използвай до 100 символа.';
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
        throw new Error(errorData?.message || 'Клиентът не можа да бъде запазен.');
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
      console.error('Грешка при запазване на клиента:', err);
      setError(err instanceof Error ? err.message : 'Клиентът не можа да бъде запазен.');
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
        throw new Error('Клиентът не можа да бъде изтрит.');
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Грешка при изтриване на клиента:', err);
      setError('Клиентът не можа да бъде изтрит.');
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
        throw new Error(errorData?.message || 'Ролята на клиента не можа да бъде променена.');
      }

      await fetchUsers();
      if (selectedUser?.id === userId) {
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err) {
      console.error('Грешка при промяна на ролята:', err);
      setError(err instanceof Error ? err.message : 'Ролята на клиента не можа да бъде променена.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Управление на клиенти</h1>
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
          Добави клиент
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
                Име
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Имейл
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роля
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
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
                  {user.phone || 'Не е посочен'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleRole(user.id)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    } hover:bg-opacity-75 transition-colors`}
                  >
                    {user.role === 'Admin' ? 'Админ' : 'Клиент'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => handlePreviewUser(user)}
                    className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded-md mr-2"
                    title="Повече информация"
                    aria-label={`Повече информация за ${user.names}`}
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      handleViewUser(user);
                    }}
                    className="text-white bg-yellow-600 hover:bg-yellow-700 p-1.5 rounded-md mr-2"
                    title="Редактирай"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded-md"
                    title="Изтрий"
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

      {isPreviewModalOpen && previewUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreviewModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Информация за клиента</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Име</div>
                <div className="mt-1 text-gray-900">{previewUser.names}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Имейл</div>
                <div className="mt-1 break-all text-gray-900">{previewUser.email}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Телефон</div>
                <div className="mt-1 text-gray-900">{previewUser.phone || 'Не е посочен'}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Роля</div>
                <div className="mt-1 text-gray-900">{previewUser.role === 'Admin' ? 'Админ' : 'Клиент'}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">ID</div>
                <div className="mt-1 break-all text-gray-900">{previewUser.id}</div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Свързани поръчки
                </div>
                {previewOrdersLoading ? (
                  <div className="mt-2 text-gray-500">Зареждане на поръчките...</div>
                ) : previewOrdersError ? (
                  <div className="mt-2 text-red-600">{previewOrdersError}</div>
                ) : previewOrders.length === 0 ? (
                  <div className="mt-2 text-gray-500">Няма свързани поръчки.</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {previewOrders.map((order) => (
                      <Link
                        key={order.id}
                        to={`/admin/orders?orderId=${encodeURIComponent(order.id)}`}
                        className="block break-all rounded-md border border-blue-100 bg-blue-50 px-3 py-2 font-mono text-xs text-blue-700 hover:border-blue-300 hover:bg-blue-100"
                        title={`Отвори поръчка ${order.id}`}
                      >
                        {order.id}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closePreviewModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {selectedUser ? 'Редактирай клиент' : 'Добави клиент'}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <form onSubmit={handleUpdateUser} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Име
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
                    Имейл
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
                    Телефон
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
                      Парола
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
                    Затвори
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-500 text-white rounded-md hover:text-gray-900 hover:bg-primary-600 text-xs sm:text-sm"
                  >
                    {selectedUser ? 'Запази' : 'Добави'}
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
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Изтриване на клиент</h2>
            <p className="mb-4 sm:mb-6 text-gray-600 text-xs sm:text-sm">
              Да се изтрие ли клиентът „{selectedUser.names}“?
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
              >
                Отказ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs sm:text-sm"
              >
                Изтрий
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
