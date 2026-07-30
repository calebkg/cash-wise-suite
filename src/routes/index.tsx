import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpendWise — See where your money goes" },
      { name: "description", content: "Track expenses, set budgets, upload receipts, and analyze your spending — all in one modern dashboard." },
      { property: "og:title", content: "SpendWise — See where your money goes" },
      { property: "og:description", content: "Track expenses, set budgets, upload receipts, and analyze your spending — all in one modern dashboard." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { n: "01", title: "All accounts, one register", desc: "Bank, cash and credit balances read as a single figure." },
  { n: "02", title: "Analysis, not decoration", desc: "Composition and trend, plotted with restraint." },
  { n: "03", title: "Receipts on file", desc: "Attach documents to any entry; keep the paper trail." },
  { n: "04", title: "Budgets stated in advance", desc: "Limits per category, measured against reality." },
  { n: "05", title: "Shared books", desc: "Invite family or colleagues as viewers or editors." },
  { n: "06", title: "Written insight", desc: "A short monthly note on what actually changed." },
];

function Wordmark() {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-mono text-base font-medium tracking-[-0.03em]">SPENDWISE</span>
      <span className="h-1.5 w-1.5 bg-primary" />
    </Link>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="rounded-none">Open an account</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-ledger">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-12 md:py-32">
          <div className="md:col-span-8">
            <p className="label-eyebrow">Est. ledger — personal finance</p>
            <h1 className="mt-6 text-4xl leading-[1.05] md:text-6xl">
              See where your money goes.
              <br />
              <span className="text-primary">Then decide.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-muted-foreground">
              SpendWise keeps a serious record of your finances — accounts, budgets,
              receipts and analysis — presented with the plainness of a well-kept book.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gap-2 rounded-none">
                  Start your ledger <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-none">Sign in</Button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-6 border-l border-border pl-6 md:col-span-4">
            {[
              ["Entries recorded", "Unlimited"],
              ["Currencies", "11"],
              ["Cost to begin", "Nothing"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="label-eyebrow">{k}</p>
                <p className="numeral mt-2 text-2xl">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="rule-gold text-2xl md:text-3xl">Everything the book requires</h2>
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-card p-8">
              <span className="numeral text-xs text-primary">{f.n}</span>
              <h3 className="mt-5 text-base">{f.title}</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-16">
          <h3 className="max-w-md text-2xl leading-snug md:text-3xl">
            Open the book. Keep it honest.
          </h3>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="gap-2 rounded-none">
              Create your account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8 text-xs font-light text-muted-foreground">
          <span>© {new Date().getFullYear()} SpendWise</span>
          <span className="label-eyebrow">Kept by hand</span>
        </div>
      </footer>
    </div>
  );
}
