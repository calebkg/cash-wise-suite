# Smart Spend Tracker

### SYSTEM ROLE & INSTRUCTIONS

You are an expert full-stack developer building a production-ready, SaaS-grade **Expense Management & Financial Analytics System** called "SpendWise". 

The application must be fully functional, responsive, accessible, visually stunning, and equipped with real authentication, real database persistence (Supabase), email notification workflows, and export functionality suitable for a top-tier resume project.

---

### 1. TECH STACK & ARCHITECTURE

- **Frontend Framework:** React (TypeScript), Vite, React Router DOM

- **UI Library & Styling:** Tailwind CSS, Shadcn UI, Lucide Icons, Framer Motion (for smooth micro-interactions)

- **Data Visualization:** Recharts (Interactive Area, Bar, and Pie charts)

- **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth, Row-Level Security, Supabase Storage for receipts)

- **Email Service:** Supabase Edge Functions integrated with Resend API (for transactional emails & reports)

- **Deployment Target:** Vercel (Production-ready environment variable handling and clean routing)

---

### 2. DATABASE SCHEMA (SUPABASE POSTGRES)

Set up the database tables with proper foreign keys, indexes, and Row-Level Security (RLS) policies so users can only access their own data or shared workspace data.

1. **`profiles`**

   - `id` (uuid, references auth.users)

   - `full_name` (text), `avatar_url` (text), `currency_preference` (text, default 'USD')

   - `monthly_budget_limit` (numeric), `created_at` (timestamp)

2. **`categories`**

   - `id` (uuid, primary key), `user_id` (uuid)

   - `name` (text), `icon` (text), `color` (text), `type` ('income' | 'expense')

   - `budget_limit` (numeric, nullable)

3. **`accounts`**

   - `id` (uuid, primary key), `user_id` (uuid)

   - `name` (text - e.g., "Chase Checking", "Cash", "Crypto")

   - `type` ('checking' | 'savings' | 'credit' | 'cash')

   - `balance` (numeric), `color` (text)

4. **`transactions`**

   - `id` (uuid, primary key), `user_id` (uuid)

   - `account_id` (uuid, references accounts)

   - `category_id` (uuid, references categories)

   - `amount` (numeric), `type` ('income' | 'expense' | 'transfer')

   - `description` (text), `date` (timestamp)

   - `receipt_url` (text, nullable), `is_recurring` (boolean)

   - `tags` (text array - e.g., ['tax-deductible', 'vacation'])

5. **`recurring_rules`**

   - `id` (uuid), `user_id` (uuid), `amount` (numeric), `frequency` ('daily' | 'weekly' | 'monthly' | 'yearly')

   - `next_due_date` (date), `description` (text), `category_id` (uuid)

6. **`team_invites`**

   - `id` (uuid), `workspace_owner_id` (uuid), `invited_email` (text), `role` ('viewer' | 'editor'), `status` ('pending' | 'accepted')

---

### 3. AUTHENTICATION & SECURITY

- **Auth Provider:** Supabase Auth (Email/Password & Magic Link).

- **Security:**

  - Implement full Row-Level Security (RLS) on all tables.

  - Email Verification flow upon registration.

  - Password Reset / Forgot Password page and flow.

  - Protected Routes: Automatically redirect unauthenticated users to `/login`.

  - User Settings Page: Ability to update name, avatar, default currency, change password, and toggle email notifications.

---

### 4. CORE FEATURES & MODULES

#### A. Interactive Dashboard (`/dashboard`)

- **KPI Summary Cards:** Total Balance, Monthly Income, Monthly Expense, and Net Savings Rate (% change vs previous month).

- **Interactive Visualizations:**

  - Monthly Cash Flow (Area chart: Income vs Expenses over time).

  - Category Breakdown (Donut chart showing expense distribution).

- **Recent Transactions Table:** Quick action to search, filter, edit, or delete items.

- **Budget Progress Bars:** Real-time visual progress showing percentage used per category with warnings when > 80%.

#### B. Transaction Management (`/transactions`)

- **Data Table:** Fully searchable, sortable by date/amount, and filterable by category, account, date range, or tags.

- **Add/Edit Transaction Modal:**

  - Amount, Account, Category, Date, Type (Income/Expense/Transfer).

  - Drag-and-Drop Receipt Attachment upload (saved directly to Supabase Storage bucket `receipts`).

  - Recurring Transaction toggle (auto-creates future entries).

- **Export Functionality:**

  - Export transactions list to CSV.

  - Generate a formatted PDF Monthly Expense Report.

#### C. Budgeting & Goal Tracker (`/budgets`)

- Category-level monthly limit setting.

- Visual status indicators: Safe (Green), Caution (Yellow), Exceeded (Red).

- Savings Goal Tracker (e.g., "Emergency Fund", "New Laptop") with interactive progress bars.

#### D. Analytics & Insights (`/analytics`)

- Deep dive charts: Spending trends, top vendor/merchant analysis, income vs. expense ratio history.

- AI/Automated Insights Card: Displays automatic callouts (e.g., *"You spent 24% more on Dining Out this month compared to last month"*).

#### E. Team / Shared Workspaces (`/workspace`)

- Allow inviting family or team members via email (`team_invites`).

- Role-based permissions (Viewer vs Editor).

---

### 5. EMAIL & NOTIFICATION SYSTEM

Implement Supabase Edge Functions with Resend to handle transactional emails:

1. **Welcome Email:** Sent automatically upon user sign-up.

2. **Budget Threshold Alert:** Trigger an automated email alert when a category budget exceeds 90%.

3. **Weekly Digest Summary:** Scheduled summary email with total spent, highest expense, and remaining budget.

4. **Workspace Invite Email:** Send formatted email invitations to collaborators with an acceptance link.

---

### 6. UI/UX DESIGN SYSTEM

- **Modern Dark/Light Mode:** Full Shadcn Theme Support with a polished dark-mode default.

- **Color Palette:** Professional slate, rich emerald green (income), crimson (expenses), and indigo accents.

- **Micro-interactions:** Smooth hover effects, loading skeletons for data fetching, toast notifications (Sonner/Shadcn Toast) for every CRUD action.

- **Mobile-Responsive:** Adaptive navigation drawer/bottom navigation on mobile screens.

---

### 7. VERCEL DEPLOYMENT PREPARATION

- Ensure all Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are cleanly structured using `.env.example`.

- Ensure proper single-page app (SPA) fallback routing configuration (e.g., `vercel.json` rewrite rules) so page refreshes on sub-routes don't trigger 404 errors.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b65dc330-a18c-46c3-9448-d2d02cd5bf4f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
