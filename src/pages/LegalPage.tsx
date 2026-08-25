"use client";

import { useLanguageTheme } from "../i18n/LanguageThemeContext";

type LegalKind = "privacy" | "security" | "cookies";

type Props = { kind: LegalKind };

const content = {
  privacy: {
    titleBg: "Политика за поверителност",
    titleEn: "Privacy policy",
    sectionsBg: [
      ["Какви данни обработваме", "При поръчка или регистрация обработваме данните, необходими за изпълнение на услугата: име, телефон, имейл, адрес за доставка и информация за поръчката."],
      ["За какво ги използваме", "Данните се използват за обработване и доставка на поръчки, комуникация с клиента, поддръжка на профила и изпълнение на законови задължения."],
      ["Срок на съхранение", "Съхраняваме данните само за необходимия срок според целта на обработването и приложимите законови изисквания."],
      ["Вашите права", "Можете да поискате достъп, корекция или изтриване на лични данни, когато законът позволява това, чрез посочените в сайта контакти."],
    ],
    sectionsEn: [
      ["Data we process", "When you order or register, we process the information necessary to provide the service: name, phone, email, delivery address and order information."],
      ["How we use it", "Data is used to process and deliver orders, communicate with customers, maintain accounts and meet legal obligations."],
      ["Retention", "We retain data only for as long as necessary for the stated purpose and applicable legal requirements."],
      ["Your rights", "You may request access, correction or deletion of personal data where permitted by law using the contact details listed on the website."],
    ],
  },
  security: {
    titleBg: "Сигурност",
    titleEn: "Security",
    sectionsBg: [
      ["Защита на данните", "Използваме технически и организационни мерки за ограничаване на неоторизиран достъп, промяна или загуба на данни."],
      ["Плащания и поръчки", "Поръчките се обработват през защитени връзки. Не съхраняваме платежни данни, освен ако конкретен платежен доставчик изрично не изисква това в рамките на своята услуга."],
      ["Достъп до профила", "Потребителят носи отговорност да пази данните си за вход и да не ги споделя с трети лица."],
      ["Сигнал за проблем", "При съмнение за злоупотреба или проблем със сигурността се свържете с нас чрез официалните контакти в сайта."],
    ],
    sectionsEn: [
      ["Data protection", "We use technical and organisational measures to reduce unauthorised access, alteration or loss of data."],
      ["Payments and orders", "Orders are processed over secure connections. We do not store payment details unless a specific payment provider explicitly requires this as part of its service."],
      ["Account access", "Users are responsible for keeping their login credentials secure and not sharing them with third parties."],
      ["Report an issue", "If you suspect abuse or a security problem, contact us through the official contact details on the website."],
    ],
  },
  cookies: {
    titleBg: "Политика за бисквитки",
    titleEn: "Cookie policy",
    sectionsBg: [
      ["Какво са бисквитките", "Бисквитките и локалното съхранение позволяват на сайта да запомня настройки и информация, нужна за нормалната му работа."],
      ["Задължителни", "Задължителните бисквитки и локални данни поддържат основни функции като сесия, език, количка и предпочитания за поверителност."],
      ["Допълнителни", "Аналитични или маркетингови технологии могат да бъдат активирани само след съгласие, когато такива услуги са интегрирани в сайта."],
      ["Промяна на избора", "Можете да изтриете съхраненото съгласие от настройките на браузъра и банерът ще се покаже отново при следващо посещение."],
    ],
    sectionsEn: [
      ["What cookies are", "Cookies and local storage allow the website to remember settings and information required for normal operation."],
      ["Essential", "Essential cookies and local data support core functions such as session, language, cart and privacy preferences."],
      ["Optional", "Analytics or marketing technologies may be enabled only after consent when such services are integrated into the website."],
      ["Changing your choice", "You can remove stored consent through your browser storage settings and the banner will appear again on a future visit."],
    ],
  },
} as const;

const LegalPage = ({ kind }: Props) => {
  const { language } = useLanguageTheme();
  const isBg = language === "bg";
  const page = content[kind];
  const sections = isBg ? page.sectionsBg : page.sectionsEn;

  return (
    <main className="min-h-[60vh] bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">{isBg ? page.titleBg : page.titleEn}</h1>
        <div className="mt-8 space-y-8">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default LegalPage;
