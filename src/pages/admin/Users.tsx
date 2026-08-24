import { useEffect, useState } from "react";
import { InformationCircleIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

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

const emptyForm = {
  names: "",
  email: "",
  phone: "",
  newPassword: "",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [previewOrders, setPreviewOrders] = useState<AssociatedOrder[]>([]);
  const [previewOrdersLoading, setPreviewOrdersLoading] = useState(false);
  const [previewOrdersError, setPreviewOrdersError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { token } = useSelector((state: RootState) => state.auth);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const text = {
    title: isBg ? "Управление на клиенти" : "Manage customers",
    add: isBg ? "Добави клиент" : "Add customer",
    edit: isBg ? "Редактирай клиент" : "Edit customer",
    info: isBg ? "Информация за клиента" : "Customer information",
    deleteTitle: isBg ? "Изтриване на клиент" : "Delete customer",
    name: isBg ? "Име" : "Name",
    email: isBg ? "Имейл" : "Email",
    phone: isBg ? "Телефон" : "Phone",
    role: isBg ? "Роля" : "Role",
    actions: isBg ? "Действия" : "Actions",
    admin: isBg ? "Админ" : "Admin",
    customer: isBg ? "Клиент" : "Customer",
    notProvided: isBg ? "Не е посочен" : "Not provided",
    associatedOrders: isBg ? "Свързани поръчки" : "Associated orders",
    loadingOrders: isBg ? "Зареждане на поръчките..." : "Loading orders...",
    noOrders: isBg ? "Няма свързани поръчки." : "No associated orders.",
    close: isBg ? "Затвори" : "Close",
    password: isBg ? "Парола" : "Password",
    save: isBg ? "Запази" : "Save",
    cancel: isBg ? "Отказ" : "Cancel",
    delete: isBg ? "Изтрий" : "Delete",
    moreInfo: isBg ? "Повече информация" : "More information",
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(isBg ? "Клиентите не можаха да бъдат заредени." : "Customers could not be loaded.");
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Customers load failed:", err);
      setError(err instanceof Error ? err.message : isBg ? "Клиентите не можаха да бъдат заредени." : "Customers could not be loaded.");
    }
  };

  const handlePreviewUser = async (user: User) => {
    setPreviewUser(user);
    setPreviewOrders([]);
    setPreviewOrdersError("");
    setPreviewOrdersLoading(true);
    setIsPreviewModalOpen(true);

    try {
      const queryParams = new URLSearchParams({
        UserId: user.id,
        PageNumber: "1",
        PageSize: "1000",
        SortBy: "createdOn",
        SortDescending: "true",
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Orders/get-list?${queryParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(isBg ? "Свързаните поръчки не можаха да бъдат заредени." : "Associated orders could not be loaded.");

      const data = await response.json();
      const orders = Array.isArray(data) ? data : data && Array.isArray(data.items) ? data.items : [];
      const uniqueOrders = Array.from(
        new Map(
          orders
            .filter((order: AssociatedOrder) => Boolean(order?.id))
            .map((order: AssociatedOrder) => [order.id, { id: order.id }])
        ).values()
      ) as AssociatedOrder[];
      setPreviewOrders(uniqueOrders);
    } catch (err) {
      setPreviewOrdersError(err instanceof Error ? err.message : isBg ? "Свързаните поръчки не можаха да бъдат заредени." : "Associated orders could not be loaded.");
    } finally {
      setPreviewOrdersLoading(false);
    }
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewUser(null);
    setPreviewOrders([]);
    setPreviewOrdersError("");
    setPreviewOrdersLoading(false);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({ names: user.names, email: user.email, phone: user.phone || "", newPassword: "" });
    setValidationErrors({});
    setError("");
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setSelectedUser(null);
    setEditFormData(emptyForm);
    setValidationErrors({});
    setError("");
    setIsModalOpen(true);
  };

  const closeEdit = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setEditFormData(emptyForm);
    setValidationErrors({});
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditFormData((previous) => ({ ...previous, [name]: value }));
    setValidationErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};
    if (!editFormData.names.trim()) errors.names = isBg ? "Името на клиента е задължително." : "Customer name is required.";
    else if (editFormData.names.trim().length < 2) errors.names = isBg ? "Използвай поне 2 символа." : "Use at least 2 characters.";
    else if (editFormData.names.trim().length > 50) errors.names = isBg ? "Използвай до 50 символа." : "Use up to 50 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.email.trim()) errors.email = isBg ? "Имейлът е задължителен." : "Email is required.";
    else if (!emailRegex.test(editFormData.email)) errors.email = isBg ? "Въведи валиден имейл адрес." : "Enter a valid email address.";
    else if (users.some((user) => user.email.toLowerCase() === editFormData.email.toLowerCase() && user.id !== selectedUser?.id)) {
      errors.email = isBg ? "Клиент с този имейл вече съществува." : "A customer with this email already exists.";
    }

    if (editFormData.phone.trim() && !/^[0-9]{10}$/.test(editFormData.phone.trim())) {
      errors.phone = isBg ? "Въведи валиден 10-цифрен телефонен номер." : "Enter a valid 10-digit phone number.";
    }

    if (!selectedUser) {
      if (!editFormData.newPassword) errors.newPassword = isBg ? "Паролата е задължителна при добавяне на нов клиент." : "Password is required for a new customer.";
      else if (editFormData.newPassword.length < 6) errors.newPassword = isBg ? "Използвай поне 6 символа." : "Use at least 6 characters.";
      else if (editFormData.newPassword.length > 100) errors.newPassword = isBg ? "Използвай до 100 символа." : "Use up to 100 characters.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!validateForm()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users`, {
        method: selectedUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          selectedUser
            ? { id: selectedUser.id, email: editFormData.email, names: editFormData.names, phone: editFormData.phone }
            : { email: editFormData.email, password: editFormData.newPassword, names: editFormData.names, phone: editFormData.phone }
        ),
      });

      const errorData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorData?.message || (isBg ? "Клиентът не можа да бъде запазен." : "Customer could not be saved."));

      await fetchUsers();
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Клиентът не можа да бъде запазен." : "Customer could not be saved.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(isBg ? "Клиентът не можа да бъде изтрит." : "Customer could not be deleted.");
      await fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Клиентът не можа да бъде изтрит." : "Customer could not be deleted.");
    }
  };

  const handleToggleRole = async (userId: string) => {
    try {
      const currentUser = users.find((user) => user.id === userId);
      if (!currentUser) return;
      const endpoint = currentUser.role === "Admin"
        ? `${process.env.NEXT_PUBLIC_API_URL}/Users/demote-to-registered-customer`
        : `${process.env.NEXT_PUBLIC_API_URL}/Users/promote-to-admin`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      const errorData = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorData?.message || (isBg ? "Ролята на клиента не можа да бъде променена." : "Customer role could not be changed."));
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : isBg ? "Ролята на клиента не можа да бъде променена." : "Customer role could not be changed.");
    }
  };

  const actionButtons = (user: User) => (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <button type="button" onClick={() => void handlePreviewUser(user)} className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700" title={text.moreInfo} aria-label={`${text.moreInfo}: ${user.names}`}>
        <InformationCircleIcon className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => handleViewUser(user)} className="rounded-md bg-yellow-600 p-2 text-white hover:bg-yellow-700" title={text.edit}>
        <PencilIcon className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }} className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700" title={text.delete}>
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
        <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-500 px-4 py-2 text-white transition hover:bg-primary-600">
          <PlusIcon className="mr-2 h-5 w-5" />
          {text.add}
        </button>
      </div>

      {error && <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-950">{user.names}</h2>
                <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
                <p className="mt-1 text-sm text-slate-500">{user.phone || text.notProvided}</p>
              </div>
              <button type="button" onClick={() => void handleToggleRole(user.id)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "Admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                {user.role === "Admin" ? text.admin : text.customer}
              </button>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">{actionButtons(user)}</div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
        <div className="table-scroll">
          <table className="min-w-[48rem] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[text.name, text.email, text.phone, text.role].map((label) => <th key={label} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{label}</th>)}
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{text.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.names}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.phone || text.notProvided}</td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => void handleToggleRole(user.id)} className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.role === "Admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                      {user.role === "Admin" ? text.admin : text.customer}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">{actionButtons(user)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPreviewModalOpen && previewUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && closePreviewModal()}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">{text.info}</h2>
            <div className="space-y-3 text-sm">
              {[
                [text.name, previewUser.names],
                [text.email, previewUser.email],
                [text.phone, previewUser.phone || text.notProvided],
                [text.role, previewUser.role === "Admin" ? text.admin : text.customer],
                ["ID", previewUser.id],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
                  <div className="mt-1 break-all text-gray-900">{value}</div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{text.associatedOrders}</div>
                {previewOrdersLoading ? (
                  <div className="mt-2 text-gray-500">{text.loadingOrders}</div>
                ) : previewOrdersError ? (
                  <div className="mt-2 text-red-600">{previewOrdersError}</div>
                ) : previewOrders.length === 0 ? (
                  <div className="mt-2 text-gray-500">{text.noOrders}</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {previewOrders.map((order) => (
                      <Link key={order.id} to={`/admin/orders?orderId=${encodeURIComponent(order.id)}`} className="block break-all rounded-md border border-blue-100 bg-blue-50 px-3 py-2 font-mono text-xs text-blue-700 hover:border-blue-300 hover:bg-blue-100" title={isBg ? `Отвори поръчка ${order.id}` : `Open order ${order.id}`}>
                        {order.id}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={closePreviewModal} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{text.close}</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && closeEdit()}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">{selectedUser ? text.edit : text.add}</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{text.name}</label>
                <input type="text" name="names" value={editFormData.names} onChange={handleInputChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 ${validationErrors.names ? "border-red-300" : "border-gray-300"}`} />
                {validationErrors.names && <p className="mt-1 text-xs text-red-600">{validationErrors.names}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{text.email}</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleInputChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 ${validationErrors.email ? "border-red-300" : "border-gray-300"}`} />
                {validationErrors.email && <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{text.phone}</label>
                <input type="tel" name="phone" value={editFormData.phone} onChange={handleInputChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 ${validationErrors.phone ? "border-red-300" : "border-gray-300"}`} placeholder="0888123456" />
                {validationErrors.phone && <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>}
              </div>
              {!selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">{text.password}</label>
                  <input type="password" name="newPassword" value={editFormData.newPassword} onChange={handleInputChange} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 ${validationErrors.newPassword ? "border-red-300" : "border-gray-300"}`} />
                  {validationErrors.newPassword && <p className="mt-1 text-xs text-red-600">{validationErrors.newPassword}</p>}
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
                <button type="button" onClick={closeEdit} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">{text.close}</button>
                <button type="submit" className="rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600">{selectedUser ? text.save : text.add}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setIsDeleteModalOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold sm:text-xl">{text.deleteTitle}</h2>
            <p className="mb-6 text-sm text-gray-600">
              {isBg ? `Да се изтрие ли клиентът „${selectedUser.names}“?` : `Delete customer “${selectedUser.names}”?`}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">{text.cancel}</button>
              <button type="button" onClick={() => void handleDeleteConfirm()} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">{text.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
