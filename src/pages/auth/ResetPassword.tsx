import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError(isBg ? "В линка за възстановяване липсва токен." : "This reset link is missing a token.");
      return;
    }
    if (password.length < 8) {
      setError(isBg ? "Използвай поне 8 символа." : "Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError(isBg ? "Паролите не съвпадат." : "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!response.ok) throw new Error(isBg ? "Паролата не можа да бъде променена." : "Unable to reset password.");
      setMessage(isBg ? "Паролата е обновена. Вече можеш да влезеш с новата парола." : "Your password has been updated. You can sign in with the new one now.");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "Линкът за възстановяване е невалиден или е изтекъл." : "This reset link is invalid or has expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-3 py-8 sm:px-4 sm:py-14">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">{isBg ? "Нова парола" : "New password"}</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{isBg ? "Избери нова парола" : "Choose a new password"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Задай нова сигурна парола за профила си в HygiaTrade." : "Pick a new password for your HygiaTrade account and keep it somewhere secure."}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">{isBg ? "Нова парола" : "New password"}</label>
            <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" placeholder={isBg ? "Поне 8 символа" : "At least 8 characters"} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">{isBg ? "Повтори паролата" : "Confirm password"}</label>
            <input id="confirmPassword" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" />
          </div>

          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? (isBg ? "Обновяване..." : "Updating password...") : (isBg ? "Обнови паролата" : "Update password")}</button>
        </form>

        <p className="mt-6 text-sm text-slate-500">{isBg ? "Обратно към" : "Back to"} <Link to="/login" className="font-semibold text-primary-600">{isBg ? "вход" : "sign in"}</Link></p>
      </div>
    </div>
  );
};

export default ResetPassword;
