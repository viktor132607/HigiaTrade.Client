import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Unable to prepare password reset.");
      }

      const data = (await response.json()) as { message: string; previewResetLink?: string };
      setMessage(data.message);
      setPreviewLink(data.previewResetLink ?? null);
    } catch (requestError) {
      console.error(requestError);
      setError("We could not prepare a reset link right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-14">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Password reset</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the email address linked to your account and we&apos;ll prepare a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
              placeholder="you@example.com"
            />
          </div>

          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {previewLink && (
            <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
              Development preview: <a href={previewLink} className="font-semibold underline break-all">{previewLink}</a>
            </div>
          )}
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Preparing link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Back to <Link to="/login" className="font-semibold text-primary-600">sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
