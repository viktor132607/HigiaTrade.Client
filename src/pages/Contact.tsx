import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL, readApiJson } from "../config/api";
import {
  CONTACT_ADDRESS_BG,
  CONTACT_ADDRESS_EN,
  CONTACT_AREA_BG,
  CONTACT_AREA_EN,
  CONTACT_EMAILS,
  CONTACT_EMBED_MAP_URL,
  CONTACT_MAP_URL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_LINK,
} from "../config/contact";
import { useLanguageTheme } from "../i18n/LanguageThemeContext";

type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactResponse = {
  message?: string;
};

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

function isValidPhone(value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  return (
    PHONE_REGEX.test(trimmed) &&
    digitsOnly.length >= 7 &&
    digitsOnly.length <= 15
  );
}

const Contact = () => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";

  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleChange =
    (field: keyof ContactFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError("");
    setSubmitSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.message.trim()
    ) {
      setSubmitError(
        isBg
          ? "Името, имейлът, телефонът и съобщението са задължителни."
          : "Name, email, phone and message are required."
      );

      return;
    }

    if (!isValidPhone(form.phone)) {
      setSubmitError(
        isBg
          ? "Въведете валиден телефонен номер."
          : "Enter a valid phone number."
      );

      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        }),
      });

      await readApiJson<ContactResponse>(response);
      setForm(initialFormState);
      setSubmitSuccess(
        isBg
          ? "Запитването беше изпратено успешно."
          : "Your message was sent successfully."
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isBg
            ? "Неуспешно изпращане на запитването."
            : "The message could not be sent."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "rounded-2xl border border-[#d6dde3] bg-white p-6 shadow-sm transition-colors dark:border-white/20 dark:bg-black";

  const inputClass =
    "w-full rounded-none border border-[#c7d0d8] bg-white px-4 py-3 text-sm text-[#263b4d] outline-none transition placeholder:text-[#82909b] focus:border-[#18b99f] focus:ring-1 focus:ring-[#18b99f] dark:border-white/25 dark:bg-black dark:text-white dark:placeholder:text-white/45";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f4f6f8] text-[#263b4d] transition-colors dark:bg-black dark:text-white">
      <section className="border-b border-[#d6dde3] bg-[linear-gradient(135deg,#263b4d_0%,#1d5260_55%,#18b99f_130%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8be4d5]">
            HygiaTrade
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {isBg ? "Свържете се с нас" : "Contact us"}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            {isBg
              ? "Изпратете запитване за продукти, наличности, поръчки или бизнес доставки."
              : "Send an enquiry about products, availability, orders or business deliveries."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className={cardClass}>
            <PhoneIcon className="h-10 w-10 text-[#18b99f]" />
            <h2 className="mt-5 text-lg font-bold">
              {isBg ? "Телефон" : "Phone"}
            </h2>
            <a
              href={`tel:${CONTACT_PHONE_LINK}`}
              className="mt-2 inline-block text-sm text-[#4b5d6d] transition hover:text-[#18b99f] dark:text-white/75"
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </article>

          <article className={cardClass}>
            <EnvelopeIcon className="h-10 w-10 text-[#18b99f]" />
            <h2 className="mt-5 text-lg font-bold">
              {isBg ? "Имейл" : "Email"}
            </h2>
            <div className="mt-2 space-y-2">
              {CONTACT_EMAILS.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="block break-all text-sm text-[#4b5d6d] transition hover:text-[#18b99f] dark:text-white/75"
                >
                  {email}
                </a>
              ))}
            </div>
          </article>

          <article className={cardClass}>
            <MapPinIcon className="h-10 w-10 text-[#18b99f]" />
            <h2 className="mt-5 text-lg font-bold">
              {isBg ? "Адрес" : "Address"}
            </h2>
            <a
              href={CONTACT_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm leading-6 text-[#4b5d6d] transition hover:text-[#18b99f] dark:text-white/75"
            >
              {isBg ? CONTACT_ADDRESS_BG : CONTACT_ADDRESS_EN}
            </a>
            <p className="mt-3 text-xs leading-5 text-[#6f7f8c] dark:text-white/60">
              {isBg ? CONTACT_AREA_BG : CONTACT_AREA_EN}
            </p>
          </article>

          <article className={cardClass}>
            <ClockIcon className="h-10 w-10 text-[#18b99f]" />
            <h2 className="mt-5 text-lg font-bold">
              {isBg ? "Работно време" : "Working hours"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4b5d6d] dark:text-white/75">
              {isBg ? "Понеделник – Петък" : "Monday – Friday"}
              <br />
              09:00 – 18:00
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className={cardClass}>
            <h2 className="text-2xl font-bold tracking-tight">
              {isBg ? "Форма за контакт" : "Contact form"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4b5d6d] dark:text-white/70">
              {isBg
                ? "Попълнете формата и ще се свържем с вас възможно най-скоро."
                : "Complete the form and we will contact you as soon as possible."}
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold">
                    {isBg ? "Име" : "Name"} *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={handleChange("name")}
                    className={inputClass}
                    placeholder={isBg ? "Вашето име" : "Your name"}
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold">
                    {isBg ? "Имейл" : "Email"} *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange("email")}
                    className={inputClass}
                    placeholder={isBg ? "Вашият имейл" : "Your email"}
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="mb-2 block text-sm font-semibold">
                    {isBg ? "Телефон" : "Phone"} *
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={20}
                    value={form.phone}
                    onChange={handleChange("phone")}
                    className={inputClass}
                    placeholder={isBg ? "Вашият телефон" : "Your phone"}
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold">
                    {isBg ? "Тема" : "Subject"}
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    maxLength={160}
                    value={form.subject}
                    onChange={handleChange("subject")}
                    className={inputClass}
                    placeholder={isBg ? "Тема на запитването" : "Enquiry subject"}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold">
                  {isBg ? "Съобщение" : "Message"} *
                </label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={4000}
                  value={form.message}
                  onChange={handleChange("message")}
                  className={`${inputClass} min-h-44 resize-y`}
                  placeholder={isBg ? "Опишете вашето запитване" : "Describe your enquiry"}
                />
              </div>

              {submitError ? (
                <div
                  role="alert"
                  className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                >
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div
                  role="status"
                  className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  {submitSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#18b99f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#14a990] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                {submitting
                  ? isBg
                    ? "Изпращане..."
                    : "Sending..."
                  : isBg
                    ? "Изпрати запитване"
                    : "Send enquiry"}
              </button>
            </form>
          </div>

          <div className={cardClass}>
            <h2 className="text-2xl font-bold tracking-tight">
              {isBg ? "Къде се намираме" : "Where to find us"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4b5d6d] dark:text-white/70">
              {isBg ? CONTACT_ADDRESS_BG : CONTACT_ADDRESS_EN}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#6f7f8c] dark:text-white/60">
              {isBg ? CONTACT_AREA_BG : CONTACT_AREA_EN}
            </p>

            <div className="mt-6 overflow-hidden border border-[#d6dde3] dark:border-white/20">
              <iframe
                title="HygiaTrade location"
                src={CONTACT_EMBED_MAP_URL}
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              href={CONTACT_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 border border-[#263b4d] px-5 py-3 text-sm font-bold text-[#263b4d] transition hover:border-[#18b99f] hover:text-[#18b99f] dark:border-white dark:text-white"
            >
              <MapPinIcon className="h-5 w-5" />
              {isBg ? "Отвори в Google Maps" : "Open in Google Maps"}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Contact;
