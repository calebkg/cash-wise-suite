import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/page-header";

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
    <div className="space-y-10">
      <PageHeader
        index="03"
        title="Budgets"
        subtitle="Limits set in advance, measured without flattery."
      />
      <ComingSoon
        note="Category budgets and savings goals with month-over-month adherence tracking are next in the build."
        items={["Category limits", "Savings goals", "Overspend notices"]}
      />
    </div>
  ),
});
