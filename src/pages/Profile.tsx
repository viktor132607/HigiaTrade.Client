import { useEffect, useState } from "react";
import { ArrowDownTrayIcon, ExclamationTriangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

interface ProfileResponse {
  email: string;
  names: string;
  phone: string;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000/api").replace(/\/$/, "");

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const [profile, setProfile] = useState<ProfileResponse>({ email: "", names: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = () => {
    dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        handleUnauthorized();
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/Auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }
        if (!response.ok) throw new Error(isBg ? "Профилът не можа да бъде зареден." : "Unable to load profile.");
        const data = (await response.json()) as ProfileResponse;
        setProfile({ email: data.email ?? "", names: data.names ?? "", phone: data.phone ?? "" });
      } catch (requestError) {
        console.error(requestError);
        setError(isBg ? "Данните за профила не можаха да бъдат заредени." : "Unable to load account details.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, [token]);

  const saveProfile = async () => {
    setError(null);
    setMessage(null);
    if (!token) {
      handleUnauthorized();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(isBg ? "Профилът не можа да бъде запазен." : "Unable to save profile.");
      setIsEditing(false);
      setMessage(isBg ? "Данните на профила са обновени." : "Account details updated.");
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "Профилът не можа да бъде обновен." : "Unable to update profile.");
    }
  };

  const exportData = async () => {
    setError(null);
    setMessage(null);
    if (!token) {
      handleUnauthorized();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/Gdpr/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(isBg ? "Личните данни не можаха да бъдат експортирани." : "Unable to export personal data.");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "hygiatrade-personal-data.json";
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setMessage(isBg ? "Експортът на личните данни е изтеглен." : "Your data export has been downloaded.");
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "Личните данни не можаха да бъдат експортирани." : "Unable to export personal data.");
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(isBg ? "Да се изтрие и анонимизира ли този профил?" : "Delete and anonymize this account?");
    if (!confirmed) return;
    setError(null);
    setMessage(null);
    if (!token) {
      handleUnauthorized();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/Gdpr/delete-account`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(isBg ? "Профилът не можа да бъде изтрит." : "Unable to delete account.");
      dispatch(logout());
      navigate("/login");
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "Профилът не можа да бъде изтрит." : "Unable to delete account.");
    }
  };

  if (isLoading) return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50"><div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" /></div>;

  return (
    <div className="bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary-50 text-primary-600 sm:h-14 sm:w-14"><UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8" /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 sm:text-sm sm:tracking-[0.24em]">{isBg ? "Потребителски профил" : "Account profile"}</p>
                <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{isBg ? "Настройки на профила" : "Account settings"}</h1>
              </div>
            </div>
            <Link to="/orders" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary-300 hover:text-primary-700">{isBg ? "Виж поръчките" : "View orders"}</Link>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
            {[
              { key: "names", label: isBg ? "Име и фамилия" : "Full name", type: "text" },
              { key: "email", label: isBg ? "Имейл" : "Email", type: "email" },
              { key: "phone", label: isBg ? "Телефон" : "Phone", type: "tel" },
            ].map((field) => (
              <div key={field.key} className={field.key === "names" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.key} className="block text-sm font-medium text-slate-700">{field.label}</label>
                <input id={field.key} type={field.type} value={profile[field.key as keyof ProfileResponse]} disabled={!isEditing} onChange={(event) => setProfile((previous) => ({ ...previous, [field.key]: event.target.value }))} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100" />
              </div>
            ))}
          </div>

          {(message || error) && <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ?? message}</div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button type="button" onClick={() => void saveProfile()} className="min-h-11 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">{isBg ? "Запази промените" : "Save changes"}</button>
                <button type="button" onClick={() => setIsEditing(false)} className="min-h-11 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">{isBg ? "Отказ" : "Cancel"}</button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="min-h-11 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600">{isBg ? "Редактирай профила" : "Edit profile"}</button>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 sm:tracking-[0.24em]">{isBg ? "GDPR инструменти" : "GDPR tools"}</p>
            <h2 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">{isBg ? "Изтегли личните си данни" : "Download your data"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Експортирай данните за профила, поръчките, любимите продукти и ревютата, свързани с акаунта." : "Export the profile details, orders, wishlist entries, and reviews currently associated with your account."}</p>
            <button type="button" onClick={() => void exportData()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 sm:w-auto"><ArrowDownTrayIcon className="h-4 w-4" />{isBg ? "Изтегли експорт" : "Download export"}</button>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-white p-5 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600 sm:tracking-[0.24em]">{isBg ? "Закриване на профила" : "Close account"}</p>
            <h2 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">{isBg ? "Изтрий и анонимизирай профила" : "Delete and anonymize account data"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Премахва достъпа до профила, анонимизира личните данни и изчиства адресите за доставка от старите поръчки." : "This removes access to the account, anonymizes profile fields, and clears personal delivery details from past orders."}</p>
            <button type="button" onClick={() => void deleteAccount()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 sm:w-auto"><ExclamationTriangleIcon className="h-4 w-4" />{isBg ? "Изтрий профила" : "Delete account"}</button>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Profile;
