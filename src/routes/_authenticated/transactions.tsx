import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — SpendWise" },
      { name: "description", content: "Search, filter, and manage every transaction." },
      { property: "og:title", content: "Transactions — SpendWise" },
      { property: "og:description", content: "Search, filter, and manage every transaction." },
    ],
  }),
  component: () => (
    <Placeholder title="Transactions" desc="Fully searchable table, receipt uploads, and CSV export land here in Phase 2." />
  ),
});

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      </div>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
      </Card>
    </div>
  );
}
