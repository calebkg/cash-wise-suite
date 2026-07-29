import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — SpendWise" },
      { name: "description", content: "Set category limits and track savings goals." },
      { property: "og:title", content: "Budgets — SpendWise" },
      { property: "og:description", content: "Set category limits and track savings goals." },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Budgets</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Category budget tracking and savings goals arrive in Phase 3.
        </p>
      </Card>
    </div>
  ),
});
