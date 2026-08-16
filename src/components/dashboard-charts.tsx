import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

type Props = {
  months: { month: string; income: number; expense: number }[];
  categories: { name: string; value: number }[];
  currency: string;
};

const SLICE_COLORS = [
  "var(--color-primary)",
  "color-mix(in oklch, var(--color-primary) 70%, transparent)",
  "color-mix(in oklch, var(--color-primary) 50%, transparent)",
  "color-mix(in oklch, var(--color-primary) 35%, transparent)",
  "color-mix(in oklch, var(--color-primary) 22%, transparent)",
  "color-mix(in oklch, var(--color-primary) 14%, transparent)",
];

function TooltipBox({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card px-3 py-2 text-xs">
      {label && <p className="label-eyebrow mb-2">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="numeral flex gap-3">
          <span className="text-muted-foreground">{p.name}</span>
          <span>{formatCurrency(Number(p.value), currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({ months, categories, currency }: Props) {
  const hasCategoryData = categories.some((c) => c.value > 0);

  return (
    <section className="grid gap-px border border-border bg-border lg:grid-cols-3">
      <div className="bg-card p-6 md:p-8 lg:col-span-2">
        <div className="flex items-baseline justify-between">
          <p className="label-eyebrow">Income against expenditure</p>
          <p className="label-eyebrow">Last six months</p>
        </div>
        <div className="mt-8 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.25 }}
                content={<TooltipBox currency={currency} />}
              />
              <Bar dataKey="income" name="Income" fill="var(--color-income)" maxBarSize={18} />
              <Bar dataKey="expense" name="Expense" fill="var(--color-expense)" maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card p-6 md:p-8">
        <p className="label-eyebrow">Expenditure by category</p>
        {!hasCategoryData ? (
          <p className="mt-8 text-sm font-light text-muted-foreground">
            No categorised spending in the last six months.
          </p>
        ) : (
          <>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={1}
                    stroke="var(--color-card)"
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipBox currency={currency} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {categories.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 truncate font-light text-muted-foreground">
                    <span
                      className="h-2 w-2 shrink-0"
                      style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <span className="numeral">{formatCurrency(c.value, currency)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
