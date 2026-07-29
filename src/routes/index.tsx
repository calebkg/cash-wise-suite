import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Wallet,
  PieChart,
  Receipt,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-elegant hover:border-primary/40">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">SpendWise</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Smart expense tracking, built for real life
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              See where your money goes.{" "}
              <span className="text-gradient-brand">Take control.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
              SpendWise is a modern expense manager with budgets, receipts,
              analytics, and shared workspaces — everything you need to master
              your finances.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gap-2">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-3 text-muted-foreground">
            A focused toolkit for tracking, understanding, and optimizing every dollar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Wallet} title="All accounts, one view" desc="Bank, cash, credit — see your full picture in real time." />
          <Feature icon={PieChart} title="Beautiful analytics" desc="Interactive charts to break down every category and trend." />
          <Feature icon={Receipt} title="Receipt capture" desc="Drag & drop receipts and attach them to any transaction." />
          <Feature icon={ShieldCheck} title="Budgets that adapt" desc="Set category limits and get alerted before you overspend." />
          <Feature icon={Users} title="Shared workspaces" desc="Invite family or teammates as viewers or editors." />
          <Feature icon={Sparkles} title="Automated insights" desc="Get plain-English callouts about your changing habits." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <div className="rounded-3xl border bg-card p-10 text-center shadow-elegant">
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ready to take control of your money?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your free account in seconds. No credit card required.
          </p>
          <div className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="gap-2">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SpendWise. Built with care.
        </div>
      </footer>
    </div>
  );
}
