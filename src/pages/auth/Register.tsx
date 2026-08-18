import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TermsOfService from "../../components/modals/TermsOfService";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    names: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("You need to accept the terms and privacy notice to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          names: formData.names,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      if (response.status === 409) {
        throw new Error("An account with this email already exists.");
      }

      if (!response.ok) {
        throw new Error("Registration failed.");
      }

      navigate("/login", {
        state: {
          message: "Your account is ready. You can sign in now.",
        },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-14">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_32px_90px_-55px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Create account</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Create your HygiaTrade account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Save your details for faster checkout, keep a wishlist, and follow your orders from one place.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="names" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="names"
                type="text"
                required
                value={formData.names}
                onChange={(event) => setFormData((previous) => ({ ...previous, names: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(event) => setFormData((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              I agree to the terms of service and the use of my personal data for account setup, checkout, and order updates.
              <button type="button" onClick={() => setIsTermsOpen(true)} className="ml-1 font-semibold text-primary-600">
                Read terms
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-primary-600">Sign in</Link>
        </p>
      </div>

      <TermsOfService isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default Register;
