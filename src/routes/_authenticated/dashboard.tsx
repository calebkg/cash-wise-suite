import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SpendWise" },
      { name: "description", content: "Your financial overview: balance, income, expenses, and budgets." },
      { property: "og:title", content: "Dashboard — SpendWise" },
      { property: "og:description", content: "Your financial overview at a glance." },
    ],
  }),
  component: Dashboard,
});

type Profile = { full_name: string | null; currency_preference: string };

async function fetchDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [profileRes, accountsRes, txThisRes, txLastRes] = await Promise.all([
    supabase.from("profiles").select("full_name, currency_preference").maybeSingle(),
    supabase.from("accounts").select("balance"),
    supabase.from("transactions").select("amount, type").gte("date", startOfMonth),
    supabase.from("transactions").select("amount, type").gte("date", startOfLastMonth).lt("date", startOfMonth),
  ]);

  const profile = (profileRes.data as Profile | null) ?? { full_name: null, currency_preference: "USD" };
  const totalBalance = (accountsRes.data ?? []).reduce((s, a: any) => s + Number(a.balance ?? 0), 0);

  const sumBy = (rows: any[] | null, type: string) =>
    (rows ?? []).filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount ?? 0), 0);

  const income = sumBy(txThisRes.data, "income");
  const expense = sumBy(txThisRes.data, "expense");
  const lastIncome = sumBy(txLastRes.data, "income");
  const lastExpense = sumBy(txLastRes.data, "expense");

  const savings = income - expense;
  const lastSavings = lastIncome - lastExpense;
  const savingsChange =
    lastSavings === 0 ? (savings === 0 ? 0 : 100) : ((savings - lastSavings) / Math.abs(lastSavings)) * 100;

  return { profile, totalBalance, income, expense, savings, savingsChange };
}

function KpiCard({
  label, value, icon: Icon, accent, delta,
}: {
  label: string; value: string; icon: typeof Wallet;
  accent?: "primary" | "income" | "expense"; delta?: number;
}) {
  const ring =
    accent === "income" ? "bg-income/15 text-income" :
    accent === "expense" ? "bg-expense/15 text-expense" :
    "bg-primary/15 text-primary";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", ring)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {typeof delta === "number" && (
        <div className={cn(
          "mt-1 flex items-center gap-1 text-xs",
          delta >= 0 ? "text-income" : "text-expense",
        )}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatPercent(Math.abs(delta))} vs last month
        </div>
      )}
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { profile, totalBalance, income, expense, savings, savingsChange } = data;
  const currency = profile.currency_preference || "USD";
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening with your money this month.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total balance"    value={formatCurrency(totalBalance, currency)} icon={Wallet} accent="primary" />
        <KpiCard label="Income this month" value={formatCurrency(income, currency)}       icon={TrendingUp} accent="income" />
        <KpiCard label="Expenses this month" value={formatCurrency(expense, currency)}    icon={TrendingDown} accent="expense" />
        <KpiCard label="Net savings"      value={formatCurrency(savings, currency)}       icon={PiggyBank} accent="primary" delta={savingsChange} />
      </section>

      <Card className="p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">You're all set!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is ready. Head over to <strong>Transactions</strong> to start
            logging income and expenses, or set up <strong>Budgets</strong> to keep
            spending on track. Charts, receipts, and workspace collaboration are
            coming online next.
          </p>
        </div>
      </Card>
    </div>
  );
}
