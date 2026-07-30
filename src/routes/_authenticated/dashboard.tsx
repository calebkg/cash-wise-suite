import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

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

  const { profile, totalBalance, income, expense, savings, savingsChange } = data;
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
          <p className="label-eyebrow">Next entries</p>
          <ol className="mt-6 space-y-3 text-sm font-light text-muted-foreground">
            <li className="flex gap-3">
              <span className="numeral text-xs text-primary">01</span> Record transactions
            </li>
            <li className="flex gap-3">
              <span className="numeral text-xs text-primary">02</span> Define category budgets
            </li>
            <li className="flex gap-3">
              <span className="numeral text-xs text-primary">03</span> Review monthly analytics
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
