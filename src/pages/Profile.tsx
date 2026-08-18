import { useEffect, useState } from "react";
import { ArrowDownTrayIcon, ExclamationTriangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";

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

  const [profile, setProfile] = useState<ProfileResponse>({
    email: "",
    names: "",
    phone: "",
  });

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
        const response = await fetch(`${API_BASE_URL}/Auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          console.error("Auth/me failed:", response.status, text);
          throw new Error("Unable to load profile.");
        }

        const data = (await response.json()) as ProfileResponse;

        setProfile({
          email: data.email ?? "",
          names: data.names ?? "",
          phone: data.phone ?? "",
        });
      } catch (requestError) {
        console.error(requestError);
        setError("Unable to load account details.");
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("Auth/me update failed:", response.status, text);
        throw new Error("Unable to save profile.");
      }

      setIsEditing(false);
      setMessage("Account details updated.");
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to update profile.");
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
      const response = await fetch(`${API_BASE_URL}/Gdpr/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("Gdpr/export failed:", response.status, text);
        throw new Error("Unable to export personal data.");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "hygiatrade-personal-data.json";
      link.click();

      URL.revokeObjectURL(downloadUrl);
      setMessage("Your data export has been downloaded.");
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to export personal data.");
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("Delete and anonymize this account?");

    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    if (!token) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Gdpr/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error("Gdpr/delete-account failed:", response.status, text);
        throw new Error("Unable to delete account.");
      }

      dispatch(logout());
      navigate("/login");
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to delete account.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <UserCircleIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Account profile</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Account settings</h1>
              </div>
            </div>
            <Link
              to="/orders"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
            >
              View orders
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { key: "names", label: "Full name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "Phone", type: "tel" },
            ].map((field) => (
              <div key={field.key} className={field.key === "names" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.key} className="block text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type={field.type}
                  value={profile[field.key as keyof ProfileResponse]}
                  disabled={!isEditing}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>

          {(message || error) && (
            <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${error ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error ?? message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
              >
                Edit profile
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">GDPR tools</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">Download your data</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Export the profile details, orders, wishlist entries, and reviews currently associated with your account.
            </p>
            <button
              type="button"
              onClick={exportData}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download export
            </button>
          </article>

          <article className="rounded-[2rem] border border-rose-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-600">Close account</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">Delete and anonymize account data</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This removes access to the account, anonymizes profile fields, and clears personal delivery details from past orders.
            </p>
            <button
              type="button"
              onClick={deleteAccount}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              Delete account
            </button>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Profile;