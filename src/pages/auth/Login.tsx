import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { API_BASE_URL, readApiJson } from "../../config/api";
import { setToken, setUser } from "../../store/slices/authSlice";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  email?: string;
  names?: string;
  phone?: string;
  role?: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await readApiJson<LoginResponse>(response);
      dispatch(setToken(data.accessToken));
      dispatch(setUser({
        id: data.userId ?? "",
        email: data.email ?? email.trim(),
        name: data.names ?? (isBg ? "Клиент" : "Customer"),
        phone: data.phone ?? "",
        role: data.role ?? "RegisteredCustomer",
      }));

      if (data.role === "Admin") {
        navigate("/admin");
        return;
      }
      navigate("/");
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "Въведи валиден имейл и парола." : "Enter a valid email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-3 py-8 sm:px-4 sm:py-14">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">{isBg ? "Вход" : "Sign in"}</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{isBg ? "Влез в профила си в HygiaTrade" : "Sign in to your HygiaTrade account"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Достъп до количката, поръчките, любимите продукти и данните на профила." : "Access your cart, track orders, manage saved products, and update your account details."}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          {successMessage && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">{isBg ? "Имейл" : "Email"}</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" placeholder="you@example.com" />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">{isBg ? "Парола" : "Password"}</label>
              <Link to="/forgot-password" className="text-sm font-semibold text-primary-600">{isBg ? "Забравена парола?" : "Forgot password?"}</Link>
            </div>
            <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" placeholder={isBg ? "Въведи паролата си" : "Enter your password"} />
          </div>

          <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? (isBg ? "Влизане..." : "Signing in...") : (isBg ? "Вход" : "Sign in")}</button>
        </form>

        <p className="mt-6 text-sm text-slate-500">{isBg ? "Нов потребител?" : "New here?"} <Link to="/register" className="font-semibold text-primary-600">{isBg ? "Създай профил" : "Create an account"}</Link></p>
      </div>
    </div>
  );
};

export default Login;
