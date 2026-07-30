import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/page-header";

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
    <div className="space-y-10">
      <PageHeader
        index="04"
        title="Analytics"
        subtitle="Trends read over time, not headlines read over a day."
      />
      <ComingSoon
        note="Cash-flow trends, category composition, merchant concentration, and written monthly insights are in preparation."
        items={["Cash-flow trend", "Category composition", "Written monthly insight"]}
      />
    </div>
  ),
});
