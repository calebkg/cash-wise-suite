import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/page-header";

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
    <div className="space-y-10">
      <PageHeader
        index="05"
        title="Workspace"
        subtitle="Shared books, with roles stated clearly."
      />
      <ComingSoon
        note="Invite viewers and editors to a shared workspace, with role-scoped access enforced at the database level."
        items={["Email invitations", "Viewer and editor roles", "Shared ledger access"]}
      />
    </div>
  ),
});
