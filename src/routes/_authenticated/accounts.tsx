import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  ACCOUNT_TYPES,
  useAccounts,
  useCategories,
  useDeleteAccount,
  useDeleteCategory,
  useSaveAccount,
  useSaveCategory,
  type Account,
  type Category,
} from "@/lib/ledger";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts & Categories — SpendWise" },
      {
        name: "description",
        content: "Maintain the accounts you hold and the categories you file entries under.",
      },
      { property: "og:title", content: "Accounts & Categories — SpendWise" },
      { property: "og:description", content: "Maintain accounts and categories in your ledger." },
    ],
  }),
  component: AccountsPage,
});

function AccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: Account | null;
}) {
  const save = useSaveAccount();
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("checking");
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "checking");
    setBalance(account ? String(account.balance) : "0");
  }, [open, account]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>{account ? "Amend account" : "New account"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="acc-name">Name</Label>
            <Input
              id="acc-name"
              className="rounded-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Everyday checking"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Balance</Label>
              <Input
                id="acc-balance"
                inputMode="decimal"
                className="numeral rounded-none"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-none"
            disabled={save.isPending || !name.trim()}
            onClick={async () => {
              await save.mutateAsync({
                id: account?.id,
                name: name.trim(),
                type,
                balance: Number(balance) || 0,
              });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: Category | null;
}) {
  const save = useSaveCategory();
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("expense");
  const [limit, setLimit] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? "expense");
    setLimit(category?.budget_limit != null ? String(category.budget_limit) : "");
  }, [open, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>{category ? "Amend category" : "New category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              className="rounded-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Groceries"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Category["type"])}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-limit">Monthly limit</Label>
              <Input
                id="cat-limit"
                inputMode="decimal"
                className="numeral rounded-none"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-none"
            disabled={save.isPending || !name.trim()}
            onClick={async () => {
              await save.mutateAsync({
                id: category?.id,
                name: name.trim(),
                type,
                budget_limit: limit.trim() === "" ? null : Number(limit) || 0,
              });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccountsPage() {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const removeAccount = useDeleteAccount();
  const removeCategory = useDeleteCategory();

  const [accountDialog, setAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        index="06"
        title="Accounts & Categories"
        subtitle="The chart of accounts: where money sits, and the headings entries are filed under."
        action={
          <div className="text-right">
            <p className="label-eyebrow">Total held</p>
            <p className="numeral mt-2 text-sm">{formatCurrency(total)}</p>
          </div>
        }
      />

      <Tabs defaultValue="accounts">
        <TabsList className="rounded-none border border-border bg-transparent p-0">
          <TabsTrigger value="accounts" className="label-eyebrow rounded-none px-5 py-2.5">
            Accounts
          </TabsTrigger>
          <TabsTrigger value="categories" className="label-eyebrow rounded-none px-5 py-2.5">
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button
              className="rounded-none"
              onClick={() => {
                setEditingAccount(null);
                setAccountDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New account
            </Button>
          </div>
          {loadingAccounts ? (
            <Skeleton className="h-40 w-full" />
          ) : accounts.length === 0 ? (
            <p className="border border-border p-10 text-center text-sm font-light text-muted-foreground">
              No accounts yet. Add the accounts you hold to give entries a home.
            </p>
          ) : (
            <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((a) => (
                <div key={a.id} className="group bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="label-eyebrow">
                        {ACCOUNT_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                      </p>
                      <p className="mt-3 text-base">{a.name}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none"
                        onClick={() => {
                          setEditingAccount(a);
                          setAccountDialog(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none text-expense"
                        onClick={() => removeAccount.mutate(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="numeral mt-8 text-2xl">{formatCurrency(Number(a.balance))}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button
              className="rounded-none"
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New category
            </Button>
          </div>
          {loadingCategories ? (
            <Skeleton className="h-40 w-full" />
          ) : categories.length === 0 ? (
            <p className="border border-border p-10 text-center text-sm font-light text-muted-foreground">
              No categories yet. Create headings such as Groceries, Rent, or Salary.
            </p>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {categories.map((c) => (
                <li key={c.id} className="group flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <span
                      className={
                        "label-eyebrow " +
                        (c.type === "income" ? "text-income" : "text-expense")
                      }
                    >
                      {c.type}
                    </span>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="numeral text-xs text-muted-foreground">
                      {c.budget_limit != null ? formatCurrency(Number(c.budget_limit)) : "no limit"}
                    </span>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none"
                        onClick={() => {
                          setEditingCategory(c);
                          setCategoryDialog(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none text-expense"
                        onClick={() => removeCategory.mutate(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <AccountDialog open={accountDialog} onOpenChange={setAccountDialog} account={editingAccount} />
      <CategoryDialog
        open={categoryDialog}
        onOpenChange={setCategoryDialog}
        category={editingCategory}
      />
    </div>
  );
}
