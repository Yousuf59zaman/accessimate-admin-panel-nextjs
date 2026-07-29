import Link from "next/link";
import ReviewerAccessButtons from "@/app/components/home/ReviewerAccessButtons";

const capabilities = [
  {
    icon: "fa-solid fa-shield-halved",
    title: "Server-owned authentication",
    description:
      "JWTs stay inside secure HttpOnly cookies behind a same-origin Next.js BFF, with separate admin and citizen sessions.",
  },
  {
    icon: "fa-solid fa-table-list",
    title: "34 persisted CMS modules",
    description:
      "Real PostgreSQL CRUD, backend search, filters, pagination, soft delete, restore, permissions, uploads, and audit logs.",
  },
  {
    icon: "fa-solid fa-sitemap",
    title: "Role-aware navigation",
    description:
      "Database-managed recursive menus power both the live sidebar and drag-and-drop menu editor through dedicated DTOs.",
  },
  {
    icon: "fa-solid fa-chart-pie",
    title: "Live operational analytics",
    description:
      "Interactive charts use real account, resource, status, trash, and seven-day audit activity data from the NestJS API.",
  },
];

const stack = ["Next.js 16", "React 19", "NestJS 11", "Prisma 6", "PostgreSQL", "TypeScript", "Vercel", "Neon"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(14,165,233,0.2),transparent_32%),linear-gradient(to_bottom,#020617,#0f172a)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <i className="fa-solid fa-universal-access" />
            </span>
            <span>Accessimate Control</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-300">
            <Link href="/login" className="hidden transition hover:text-white sm:inline">Citizen</Link>
            <Link href="/admin-login" className="rounded-lg border border-white/15 px-4 py-2 transition hover:border-white/30 hover:bg-white/5">Admin sign in</Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-32 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.17em] text-sky-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              Independent full-stack deployment
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              A production-shaped, multi-panel{" "}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-200 bg-clip-text text-transparent">SaaS control system.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Rebuilt from the frontend contract into an original NestJS,
              Prisma, and PostgreSQL backend—without relying on the former
              legacy service or database.
            </p>
            <div className="mt-9">
              <ReviewerAccessButtons />
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <i className="fa-solid fa-lock" /> Public reviewer sessions are read-only; owner mutations remain protected.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-slate-400">accessimate / architecture</span>
              </div>
              <div className="space-y-4 p-5 sm:p-7">
                {[
                  ["Next.js BFF", "HttpOnly role sessions", "fa-solid fa-window-maximize"],
                  ["NestJS API", "Auth · CRUD · menus · analytics", "fa-solid fa-code"],
                  ["Prisma ORM", "Typed queries and migrations", "fa-solid fa-diagram-project"],
                  ["Neon PostgreSQL", "Independent persisted data", "fa-solid fa-database"],
                ].map(([title, detail, icon], index) => (
                  <div key={title} className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300"><i className={icon} /></span>
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="mt-1 text-xs text-slate-400">{detail}</p>
                    </div>
                    <span className="ml-auto text-xs font-black text-slate-600">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 text-slate-950 dark:bg-slate-900 dark:text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">What is implemented</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Built for real workflow inspection, not a static mockup.</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><i className={item.icon} /></span>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-2">
            {stack.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{item}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
