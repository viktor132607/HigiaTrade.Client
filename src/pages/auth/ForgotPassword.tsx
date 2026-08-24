import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const ForgotPassword = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPreviewLink(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(isBg ? "Не можа да бъде подготвено възстановяване на паролата." : "Unable to prepare password reset.");
      const data = (await response.json()) as { message: string; previewResetLink?: string };
      setMessage(data.message);
      setPreviewLink(data.previewResetLink ?? null);
    } catch (requestError) {
      console.error(requestError);
      setError(isBg ? "В момента не можем да подготвим линк за възстановяване." : "We could not prepare a reset link right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-3 py-8 sm:px-4 sm:py-14">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">{isBg ? "Възстановяване на парола" : "Password reset"}</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{isBg ? "Забравена парола?" : "Forgot your password?"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Въведи имейла към профила си и ще подготвим линк за смяна на паролата." : "Enter the email address linked to your account and we'll prepare a password reset link."}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">{isBg ? "Имейл" : "Email"}</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100" placeholder="you@example.com" />
          </div>

          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {previewLink && (
            <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              {isBg ? "Тестов линк:" : "Development preview:"} <a href={previewLink} className="break-all font-semibold underline">{previewLink}</a>
            </div>
          )}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? (isBg ? "Подготовяне..." : "Preparing link...") : (isBg ? "Изпрати линк" : "Send reset link")}</button>
        </form>

        <p className="mt-6 text-sm text-slate-500">{isBg ? "Обратно към" : "Back to"} <Link to="/login" className="font-semibold text-primary-600">{isBg ? "вход" : "sign in"}</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
