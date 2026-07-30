import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/page-header";

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
    <div className="space-y-10">
      <PageHeader
        index="02"
        title="Transactions"
        subtitle="Every entry, recorded once and read plainly."
      />
      <ComingSoon
        note="The transaction ledger is being built: a searchable, filterable register with receipt attachments and CSV export."
        items={["Register table with filters", "Receipt attachments", "CSV import and export"]}
      />
    </div>
  ),
});
