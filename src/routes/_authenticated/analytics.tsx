import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SpendWise" },
      { name: "description", content: "Deep-dive charts and automated spending insights." },
      { property: "og:title", content: "Analytics — SpendWise" },
      { property: "og:description", content: "Deep-dive charts and automated spending insights." },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Trends, top merchants, and automated insights are coming in Phase 3.
        </p>
      </Card>
    </div>
  ),
});
