import { BuildingStorefrontIcon, ShieldCheckIcon, TruckIcon } from "@heroicons/react/24/outline";

const About = () => {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-[linear-gradient(135deg,#1d4ed8_0%,#1e3a8a_55%,#0f172a_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-primary-100">About HygiaTrade</p>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">A practical sports store built for regular training, not just browsing</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            HygiaTrade brings together reliable equipment for runners, team sports players, gym members, and outdoor enthusiasts, with product information written for real buying decisions.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-600">Our store</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">Focused on everyday athletes and local teams</h2>
          <p className="text-base leading-7 text-slate-600">
            The catalog is built around sports people actually shop for week to week: daily running shoes, football boots, training apparel, tennis gear, and accessories that earn a place in the gym bag.
          </p>
          <p className="text-base leading-7 text-slate-600">
            Orders, stock levels, and customer accounts are managed from the same platform, so the storefront stays clear while the admin side remains useful for day-to-day operations.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.55)]">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80"
            alt="Basketball court"
            className="h-full min-h-[280px] w-full rounded-[1.5rem] object-cover sm:min-h-[420px]"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          {
            icon: BuildingStorefrontIcon,
            title: "Curated categories",
            description: "Running, football, training, outdoor, cycling, tennis, basketball, and accessories are kept easy to browse.",
          },
          {
            icon: TruckIcon,
            title: "Straightforward fulfillment",
            description: "Customers can track order progress while the admin team follows stock and shipping status in one place.",
          },
          {
            icon: ShieldCheckIcon,
            title: "Account control",
            description: "Password recovery, personal data export, and account management are available from the signed-in profile area.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.5)]">
            <item.icon className="h-11 w-11 rounded-2xl bg-primary-50 p-2.5 text-primary-600" />
            <h3 className="mt-6 font-display text-xl font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default About;
