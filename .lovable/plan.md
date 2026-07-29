
# SpendWise — Build Plan

## Stack reality check

Your spec asks for **React Router DOM + Vercel + raw Supabase Edge Functions + Resend**. This project is a **TanStack Start** app on Lovable, which is a strict requirement I can't swap out. The equivalents I'll use:

- **Routing:** TanStack Router (file-based under `src/routes/`) instead of React Router DOM. Same UX, better SSR.
- **Backend:** Lovable Cloud (managed Supabase) — same Postgres, Auth, Storage, RLS.
- **Server logic:** TanStack `createServerFn` + server routes instead of Supabase Edge Functions.
- **Email:** Lovable Emails (managed, no Resend key needed) instead of Resend directly. If you specifically want Resend, say so.
- **Deploy:** Lovable's built-in publish (works out of the box, no `vercel.json` needed).

Everything else in your spec — schema, RLS, features, UI, exports — stays as requested.

## Scope & phasing

This is a very large app (7 modules, 6 tables, auth, storage, emails, exports, team workspaces, analytics). Shipping it all in one turn will produce shallow, buggy code. I'll build in phases and check in between so you can steer.

### Phase 1 — Foundation (this turn if approved)
- Enable Lovable Cloud
- Design system in `src/styles.css` (dark-default, slate + emerald/crimson/indigo, oklch tokens)
- DB migration: all 6 tables, RLS policies, grants, `user_roles` for workspace roles, trigger to auto-create profile on signup
- Storage bucket `receipts` (private, owner-scoped RLS)
- Auth: sign up / sign in / magic link / forgot password / reset password pages, protected `_authenticated/` layout
- App shell: sidebar nav (desktop) + bottom nav (mobile), theme toggle, user menu
- Landing page at `/`

### Phase 2 — Core money features
- Accounts CRUD
- Categories CRUD (with icons/colors, budget limits)
- Transactions: data table (search/sort/filter), add/edit modal, receipt upload to Storage, delete
- Dashboard: KPI cards, cash-flow area chart, category donut, recent transactions, budget progress bars
- CSV export

### Phase 3 — Budgets, analytics, recurring, PDF
- Budgets page with status indicators
- Savings goals
- Analytics page (trends, top merchants, automated insights)
- Recurring rules + a server route that materializes due entries (called on dashboard load)
- PDF monthly report

### Phase 4 — Team workspaces + emails
- Workspace invites table + invite flow
- Role-based access (viewer/editor) via `user_roles` + `has_role()` security-definer
- Email templates: welcome, budget alert (>90%), weekly digest, workspace invite
- Wire triggers (welcome on signup, budget alert on transaction insert)

## Technical notes

- **Auth-gated home:** signed-in users hit `/dashboard`, signed-out see `/` landing. `/dashboard` lives under `_authenticated/`.
- **Money precision:** store `amount` as `numeric(14,2)`; render with Intl.NumberFormat and user's `currency_preference`.
- **RLS:** every table scoped to `auth.uid()`. Workspace sharing uses `user_roles` + `has_role()` to avoid recursive policies.
- **Recurring materialization:** on dashboard load, a server fn scans `recurring_rules` where `next_due_date <= today` for the current user and inserts transactions + bumps `next_due_date`. Simple, no cron needed for MVP.
- **Weekly digest:** needs a scheduler. I'll add the template and a `/api/public/cron/weekly-digest` route protected by a `CRON_SECRET`; you (or pg_cron) call it weekly. I'll note this in the handoff.
- **AI insights:** rule-based comparisons vs previous month (no LLM needed for MVP). If you want real AI, I can wire the Lovable AI Gateway in Phase 3.

## What I need from you before starting

1. **Confirm Phase 1 scope** (foundation + auth + shell). I'll build it end-to-end, then check in.
2. **Emails:** OK with Lovable Emails (managed, requires you to add an email domain later), or do you insist on Resend (needs your API key)?
3. **Landing page `/`:** minimal marketing hero, or just redirect straight to `/auth`?

Reply "go" (with answers to 2 & 3) and I'll ship Phase 1.
