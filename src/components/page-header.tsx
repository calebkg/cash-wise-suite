import type { ReactNode } from "react";

export function PageHeader({
  index,
  title,
  subtitle,
  action,
}: {
  index: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <div className="label-eyebrow flex items-center gap-3">
          <span className="text-primary">{index}</span>
          <span className="h-px w-8 bg-border" />
          <span>SpendWise Ledger</span>
        </div>
        <h1 className="mt-4 text-3xl leading-none md:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function ComingSoon({ note, items }: { note: string; items: string[] }) {
  return (
    <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
      <div className="bg-card p-8 md:col-span-2">
        <p className="label-eyebrow">In preparation</p>
        <p className="mt-4 max-w-lg text-base font-light leading-relaxed text-foreground/80">
          {note}
        </p>
      </div>
      <ul className="bg-card p-8">
        <p className="label-eyebrow">Scheduled</p>
        <div className="mt-4 space-y-3">
          {items.map((item, i) => (
            <li key={item} className="flex items-baseline gap-3 text-sm text-muted-foreground">
              <span className="numeral text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item}
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
}
