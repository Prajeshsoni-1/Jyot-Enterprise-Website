# Jyot Enterprise — Digital Operating System

A production-ready enterprise platform for Jyot Enterprise, built to generate leads, manage customer journeys, and present the company as a Fortune 500-grade consulting and solutions partner.

## What this project is

This is the public-facing website and lead-capture engine for Jyot Enterprise. It combines a premium marketing site with a backend-connected business platform:

- **Marketing site** — service showcases, portfolio, case studies, blogs, resources, careers, and about pages.
- **Lead generation** — smart inquiry forms, consultation booking, calculators, and downloadable guides.
- **Lead management** — server-side lead scoring, routing, and secure backend persistence.
- **Document handling** — secure file uploads for proposals, drawings, and compliance documents.
- **Tools library** — 16 interactive calculators and assessments across Financial, IT, Legal, and Engineering.
- **Global search** — unified search across services, blogs, FAQs, case studies, and resources.

## Tech stack

- **Framework:** TanStack Start v1 (React 19, full-stack SSR/SSG, file-based routing)
- **Build tool:** Vite 7
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Backend / Auth / Storage:** Lovable Cloud (Supabase)
- **Language:** TypeScript
- **Icons:** Lucide React

## Project structure

```text
src/
  components/site/        # Shared site components, sections, and page blocks
  components/site/tools/  # Interactive calculators and assessments
  components/site/sections/ # Homepage and landing sections
  components/site/service/  # Service-page showcase layouts
  components/ui/          # shadcn/ui base components
  data/                   # Content catalogs (services, blogs, case studies, etc.)
  integrations/supabase/  # Generated Supabase clients (do not edit)
  lib/                    # Utilities, server functions, analytics, SEO, lead pipeline
  routes/                 # TanStack Start file-based routes
  styles.css              # Tailwind v4 theme and design tokens
public/                   # Static assets (favicon, manifest, robots, sitemap XSLT)
supabase/                 # Supabase config and migrations
```

## Getting started

### Prerequisites

- Node.js 20+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- Bun (used as the package manager in this project)
- A Lovable Cloud backend (already configured for this project)

### Install dependencies

```sh
bun install
```

### Run the development server

```sh
bun run dev
```

The app will be available at `http://localhost:8080`.

### Build for production

```sh
bun run build
```

### Type-check

```sh
bunx tsc --noEmit
```

## Environment variables

The following variables are already configured for Lovable Cloud:

| Variable                        | Purpose                       |
| ------------------------------- | ----------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anonymous Supabase client key |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project identifier   |

Do not commit `.env` files or expose service-role keys.

## Key features

### Lead capture and scoring

All forms route through `src/lib/leads.ts` → `src/lib/enquiry.functions.ts`. Each submission is:

- sanitized and rate-limited client-side,
- scored server-side by division, budget, timeline, and intent signals,
- assigned a priority (High / Medium / Low), estimated value, project size, and reference number,
- persisted to the backend `enquiries` table.

### Smart inquiry forms

Division-specific forms adapt fields to Financial, IT, Legal, and Engineering services:

- Financial — loan/funding questions, EMI calculator, document checklist.
- IT — project type, tech stack, integrations, AI readiness.
- Legal — entity type, compliance needs, trademark classes.
- Engineering — scope, drawings upload, site commissioning.

### Tools and calculators

16 interactive tools live under `/tools`:

- Financial: EMI calculator, loan eligibility, loan comparison, document checklist.
- IT: website cost calculator, ERP cost estimator, CRM recommendation, AI readiness assessment, marketing ROI calculator.
- Legal: GST registration wizard, company registration selector, trademark guide, compliance checklist.
- Engineering: project cost estimator, manufacturing assessment, CAD consultation form.

### Document uploads

File uploads use a secure signed-URL flow through Supabase Storage. Allowed file types are restricted per division; uploaded files are linked to the lead record.

### Search

`/search` provides a weighted global index across services, blogs, FAQs, case studies, and resources.

## Routes overview

| Route                                   | Purpose                            |
| --------------------------------------- | ---------------------------------- |
| `/`                                     | Homepage                           |
| `/about`                                | Company overview                   |
| `/services` / `/services/:slug`         | Service divisions and detail pages |
| `/service/:slug`                        | Alternative service detail path    |
| `/portfolio` / `/portfolio/:slug`       | Project portfolio                  |
| `/case-studies` / `/case-studies/:slug` | Case studies                       |
| `/industries` / `/industries/:slug`     | Industries served                  |
| `/blogs` / `/blogs/:slug`               | Blog and insights                  |
| `/resources` / `/resources/:slug`       | Downloadable resources             |
| `/careers` / `/careers/:slug`           | Careers and job applications       |
| `/contact`                              | Contact page                       |
| `/book`                                 | Book a consultation                |
| `/tools` / `/tools/:slug`               | Calculators and assessments        |
| `/downloads`                            | Download centre                    |
| `/search`                               | Global search                      |
| `/thank-you`                            | Post-submission confirmation       |
| `/application-submitted`                | Career application confirmation    |
| `/coming-soon`                          | Placeholder for upcoming pages     |
| `/maintenance`                          | Maintenance mode page              |
| `/sitemap.xml`                          | Generated sitemap                  |

## Design system

The design system is intentionally premium and enterprise-grade:

- **Primary brand color:** Orange (used for CTAs, accents, and emphasis).
- **Supporting accent:** Green (used sparingly for growth/success signals).
- **Typography:** Manrope for display headings, Inter for body text.
- **Surface language:** Dark navy backgrounds, subtle borders, generous whitespace, and refined micro-interactions.

All colors, spacing, and shadows are defined as semantic tokens in `src/styles.css`. Do not hardcode arbitrary color values in components.

## Production checklist

Before going live:

1. **Analytics** — set `VITE_GA_ID` and `VITE_GTM_ID` in the environment if using Google Analytics / Tag Manager.
2. **Email** — configure a sender domain in Lovable Cloud to enable lead confirmation emails.
3. **CRM / Webhook** — replace the placeholder `deliverLead` logic in `src/lib/leads.ts` with your CRM or email endpoint if needed.
4. **Domain** — connect a custom domain in Lovable.
5. **SEO** — verify titles, descriptions, and Open Graph images per route.
6. **Security** — ensure Supabase RLS policies are enabled and service-role keys are never exposed.
7. **Accessibility** — run an axe or Lighthouse audit and fix any flagged issues.
8. **Performance** — verify image sizes, lazy loading, and Core Web Vitals.

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `bun run dev`       | Start the development server |
| `bun run build`     | Build for production         |
| `bun run start`     | Start the production server  |
| `bunx tsc --noEmit` | Run TypeScript type checking |

## Important notes

- Do not edit files under `src/integrations/supabase/` — they are auto-generated.
- Do not create `src/pages/`, `src/routes/_app/index.tsx`, or React Router DOM routes — TanStack Start uses file-based routing under `src/routes/`.
- Server-only logic belongs in `createServerFn` handlers or `src/routes/api/` server routes.
- Protected data access must use `requireSupabaseAuth` middleware and authenticated Supabase clients.

## License

This project is private and owned by Jyot Enterprise.
