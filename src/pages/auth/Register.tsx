import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TermsOfService from "../../components/modals/TermsOfService";
import { useLanguageTheme } from "../../i18n/LanguageThemeContext";

const Register = () => {
  const navigate = useNavigate();
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const [formData, setFormData] = useState({ names: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(isBg ? "Паролите не съвпадат." : "Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError(isBg ? "Трябва да приемеш общите условия и известието за лични данни." : "You need to accept the terms and privacy notice to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: formData.names, email: formData.email, phone: formData.phone, password: formData.password }),
      });
      if (response.status === 409) throw new Error(isBg ? "Профил с този имейл вече съществува." : "An account with this email already exists.");
      if (!response.ok) throw new Error(isBg ? "Регистрацията не беше успешна." : "Registration failed.");

      navigate("/login", {
        state: { message: isBg ? "Профилът е създаден. Вече можеш да влезеш." : "Your account is ready. You can sign in now." },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : isBg ? "Регистрацията не беше успешна." : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-3 py-8 sm:px-4 sm:py-14">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 sm:text-sm sm:tracking-[0.28em]">{isBg ? "Регистрация" : "Create account"}</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950 sm:mt-4 sm:text-3xl">{isBg ? "Създай профил в HygiaTrade" : "Create your HygiaTrade account"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{isBg ? "Запази данните си за по-бърза поръчка, любими продукти и проследяване на поръчки." : "Save your details for faster checkout, keep a wishlist, and follow your orders from one place."}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="names" className="block text-sm font-medium text-slate-700">{isBg ? "Име и фамилия" : "Full name"}</label>
              <input id="names" type="text" required autoComplete="name" value={formData.names} onChange={(event) => setFormData((previous) => ({ ...previous, names: event.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">{isBg ? "Имейл" : "Email"}</label>
              <input id="email" type="email" required autoComplete="email" value={formData.email} onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{isBg ? "Телефон" : "Phone"}</label>
              <input id="phone" type="tel" required autoComplete="tel" value={formData.phone} onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">{isBg ? "Парола" : "Password"}</label>
              <input id="password" type="password" required autoComplete="new-password" value={formData.password} onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">{isBg ? "Повтори паролата" : "Confirm password"}</label>
              <input id="confirmPassword" type="password" required autoComplete="new-password" value={formData.confirmPassword} onChange={(event) => setFormData((previous) => ({ ...previous, confirmPassword: event.target.value }))} className={fieldClass} />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 flex-none rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span>
              {isBg ? "Съгласявам се с общите условия и използването на личните ми данни за профила, поръчките и доставката." : "I agree to the terms of service and the use of my personal data for account setup, checkout, and order updates."}
              <button type="button" onClick={() => setIsTermsOpen(true)} className="ml-1 font-semibold text-primary-600">{isBg ? "Прочети условията" : "Read terms"}</button>
            </span>
          </label>

          <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? (isBg ? "Създаване..." : "Creating account...") : (isBg ? "Създай профил" : "Create account")}</button>
        </form>

        <p className="mt-6 text-sm text-slate-500">{isBg ? "Вече имаш профил?" : "Already have an account?"} <Link to="/login" className="font-semibold text-primary-600">{isBg ? "Вход" : "Sign in"}</Link></p>
      </div>

      <TermsOfService isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default Register;
