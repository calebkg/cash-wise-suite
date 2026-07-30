import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SpendWise" },
      { name: "description", content: "Update your profile, currency preference, and notifications." },
      { property: "og:title", content: "Settings — SpendWise" },
      { property: "og:description", content: "Update your profile, currency preference, and notifications." },
    ],
  }),
  component: SettingsPage,
});

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CHF", "SEK", "BRL", "MXN"];

function SettingsPage() {
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState<string>("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCurrency(profile.currency_preference ?? "USD");
    setBudget(profile.monthly_budget_limit != null ? String(profile.monthly_budget_limit) : "");
    setNotify(profile.email_notifications ?? true);
  }, [profile]);

  async function save() {
    const parsed = z.object({
      full_name: z.string().trim().min(1).max(100),
      currency_preference: z.string().length(3),
      monthly_budget_limit: z.union([z.number().nonnegative(), z.null()]),
      email_notifications: z.boolean(),
    }).safeParse({
      full_name: fullName,
      currency_preference: currency,
      monthly_budget_limit: budget === "" ? null : Number(budget),
      email_notifications: notify,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", profile!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    refetch();
  }

  async function changePassword() {
    const pw = prompt("Enter a new password (min 8 characters)");
    if (!pw) return;
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
  }

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        index="06"
        title="Settings"
        subtitle="Your identity, currency, and correspondence preferences."
      />

      <Card className="max-w-2xl rounded-none border-border p-8 shadow-none">
        <h2 className="label-eyebrow mb-6">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Monthly budget limit</Label>
              <Input id="budget" type="number" inputMode="decimal" value={budget}
                onChange={(e) => setBudget(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                Budget alerts, weekly digests, and workspace invites.
              </p>
            </div>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Card>

      <Card className="max-w-2xl rounded-none border-border p-8 shadow-none">
        <h2 className="label-eyebrow mb-6">Security</h2>
        <Button variant="outline" onClick={changePassword}>Change password</Button>
      </Card>
    </div>
  );
}
