import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DashboardCharts } from "@/components/dashboard-charts";

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

  const startOfWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);

  const [profileRes, accountsRes, txThisRes, txLastRes, windowRes, categoriesRes] = await Promise.all([
    supabase.from("profiles").select("full_name, currency_preference").maybeSingle(),
    supabase.from("accounts").select("balance"),
    supabase.from("transactions").select("amount, type").gte("date", startOfMonth),
    supabase.from("transactions").select("amount, type").gte("date", startOfLastMonth).lt("date", startOfMonth),
    supabase
      .from("transactions")
      .select("amount, type, date, category_id, description")
      .gte("date", startOfWindow)
      .order("date", { ascending: false }),
    supabase.from("categories").select("id, name"),
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

  const windowRows = (windowRes.data ?? []) as any[];
  const categoryNames = new Map<string, string>(
    ((categoriesRes.data ?? []) as any[]).map((c) => [c.id, c.name]),
  );

  const months: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rows = windowRows.filter((r) => String(r.date).slice(0, 7) === key);
    months.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      income: sumBy(rows, "income"),
      expense: sumBy(rows, "expense"),
    });
  }

  const byCategory = new Map<string, number>();
  for (const r of windowRows) {
    if (r.type !== "expense") continue;
    const name = r.category_id ? (categoryNames.get(r.category_id) ?? "Unassigned") : "Unassigned";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(r.amount ?? 0));
  }
  const categoryBreakdown = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const recent = windowRows.slice(0, 6).map((r) => ({
    date: String(r.date),
    description: r.description as string | null,
    amount: Number(r.amount ?? 0),
    type: String(r.type),
    category: r.category_id ? (categoryNames.get(r.category_id) ?? null) : null,
  }));

  return {
    profile,
    totalBalance,
    income,
    expense,
    savings,
    savingsChange,
    months,
    categoryBreakdown,
    recent,
  };
}

function Stat({
  label,
  value,
  note,
  delta,
  tone,
  className,
  large,
}: {
  label: string;
  value: string;
  note?: string;
  delta?: number;
  tone?: "income" | "expense";
  className?: string;
  large?: boolean;
}) {
  return (
    <div className={cn("flex flex-col justify-between bg-card p-6 md:p-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <span className="label-eyebrow">{label}</span>
        {tone && (
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center border",
              tone === "income"
                ? "border-income/40 text-income"
                : "border-expense/40 text-expense",
            )}
          >
            {tone === "income" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
      <div
        className={cn(
          "numeral mt-8 leading-none",
          large ? "text-4xl md:text-6xl" : "text-2xl md:text-3xl",
        )}
      >
        {value}
      </div>
      {(note || typeof delta === "number") && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          {typeof delta === "number" && (
            <span className={cn("numeral", delta >= 0 ? "text-income" : "text-expense")}>
              {delta >= 0 ? "+" : "−"}
              {formatPercent(Math.abs(delta))}
            </span>
          )}
          <span className="font-light">{note}</span>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-px bg-border md:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-44", i === 0 && "md:col-span-2 md:row-span-2 md:h-full")} />
          ))}
        </div>
      </div>
    );
  }

  const { profile, totalBalance, income, expense, savings, savingsChange, months, categoryBreakdown, recent } = data;
  const currency = profile.currency_preference || "USD";
  const firstName = profile.full_name?.split(" ")[0] ?? "there";
  const period = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-10">
      <PageHeader
        index="01"
        title={`Good day, ${firstName}.`}
        subtitle="A plain reading of where your money stands this period. No noise, no confetti."
        action={
          <div className="text-right">
            <p className="label-eyebrow">Period</p>
            <p className="numeral mt-2 text-sm">{period}</p>
          </div>
        }
      />

      <section className="grid gap-px border border-border bg-border md:grid-cols-3 md:grid-rows-2">
        <Stat
          className="md:col-span-2 md:row-span-2 bg-ledger"
          label="Total balance across accounts"
          value={formatCurrency(totalBalance, currency)}
          note="Sum of all linked account balances"
          large
        />
        <Stat
          label="Income · this month"
          value={formatCurrency(income, currency)}
          tone="income"
          note="Received"
        />
        <Stat
          label="Expenses · this month"
          value={formatCurrency(expense, currency)}
          tone="expense"
          note="Spent"
        />
      </section>

      <section className="grid gap-px border border-border bg-border md:grid-cols-3">
        <Stat
          label="Net savings"
          value={formatCurrency(savings, currency)}
          delta={savingsChange}
          note="vs. previous month"
        />
        <div className="bg-card p-6 md:p-8">
          <p className="label-eyebrow">Savings rate</p>
          <p className="numeral mt-8 text-2xl md:text-3xl">
            {income > 0 ? formatPercent((savings / income) * 100) : "—"}
          </p>
          <div className="mt-6 h-px w-full bg-border">
            <div
              className="h-px bg-primary"
              style={{
                width: `${income > 0 ? Math.max(0, Math.min(100, (savings / income) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="bg-card p-6 md:p-8">
          <p className="label-eyebrow">Latest entries</p>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm font-light text-muted-foreground">
              Nothing recorded yet. Your most recent entries will be listed here.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {recent.map((r, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-light text-muted-foreground">
                    {r.description || r.category || "Untitled entry"}
                  </span>
                  <span
                    className={cn(
                      "numeral text-xs",
                      r.type === "income" ? "text-income" : r.type === "expense" ? "text-expense" : "",
                    )}
                  >
                    {r.type === "income" ? "+" : r.type === "expense" ? "−" : ""}
                    {formatCurrency(r.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <DashboardCharts months={months} categories={categoryBreakdown} currency={currency} />
    </div>
  );
}
