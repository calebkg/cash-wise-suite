import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — SpendWise" },
      { name: "description", content: "Invite family or teammates to collaborate on your finances." },
      { property: "og:title", content: "Workspace — SpendWise" },
      { property: "og:description", content: "Invite family or teammates to collaborate on your finances." },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Workspace</h1>
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Invite viewers and editors to your workspace in Phase 4.
        </p>
      </Card>
    </div>
  ),
});
