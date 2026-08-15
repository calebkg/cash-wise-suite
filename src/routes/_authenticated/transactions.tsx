import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { TransactionDialog } from "@/components/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Download, Paperclip, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  receiptUrl,
  toCsv,
  useAccounts,
  useCategories,
  useDeleteTransaction,
  useTransactions,
  type Transaction,
  type TxType,
} from "@/lib/ledger";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — SpendWise" },
      { name: "description", content: "Search, filter, and manage every transaction." },
      { property: "og:title", content: "Transactions — SpendWise" },
      { property: "og:description", content: "Search, filter, and manage every transaction." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TxType | "all">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [accountId, setAccountId] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: rows = [], isLoading } = useTransactions({ search, type, categoryId, accountId });
  const remove = useDeleteTransaction();

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
    const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
    return { income, expense, count: rows.length };
  }, [rows]);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";
  const accName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "—";

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function exportCsv() {
    const blob = new Blob([toCsv(rows, categories, accounts)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openReceipt(path: string) {
    try {
      window.open(await receiptUrl(path), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        index="02"
        title="Transactions"
        subtitle="Every entry, recorded once and read plainly."
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-none" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button className="rounded-none" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> New entry
            </Button>
          </div>
        }
      />

      <section className="grid gap-px border border-border bg-border sm:grid-cols-3">
        {[
          { label: "Entries", value: String(totals.count) },
          { label: "Income listed", value: formatCurrency(totals.income) },
          { label: "Expenses listed", value: formatCurrency(totals.expense) },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5">
            <p className="label-eyebrow">{s.label}</p>
            <p className="numeral mt-4 text-xl">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-none pl-9"
            placeholder="Search descriptions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as TxType | "all")}>
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="border border-border">
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-5 py-3 md:grid">
          {["Date", "Description", "Category", "Account", "Amount", ""].map((h, i) => (
            <span
              key={h + i}
              className={cn(
                "label-eyebrow",
                i === 1 && "col-span-4",
                i === 0 && "col-span-2",
                i === 2 && "col-span-2",
                i === 3 && "col-span-2",
                i === 4 && "col-span-1 text-right",
              )}
            >
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-px p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="label-eyebrow">Empty register</p>
            <p className="mt-4 text-sm font-light text-muted-foreground">
              No entries match this view. Record your first one to begin the book.
            </p>
            <Button className="mt-6 rounded-none" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> New entry
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-2 items-center gap-3 px-5 py-4 hover:bg-card md:grid-cols-12 md:gap-4"
              >
                <span className="numeral text-xs text-muted-foreground md:col-span-2">
                  {formatDate(r.date)}
                </span>
                <span className="order-first col-span-2 flex items-center gap-2 truncate text-sm md:order-none md:col-span-4">
                  {r.description || <span className="text-muted-foreground">Untitled entry</span>}
                  {r.receipt_url && (
                    <button
                      onClick={() => openReceipt(r.receipt_url!)}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="View receipt"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground md:col-span-2">
                  {catName(r.category_id)}
                </span>
                <span className="hidden truncate text-xs text-muted-foreground md:col-span-2 md:block">
                  {accName(r.account_id)}
                </span>
                <span
                  className={cn(
                    "numeral text-right text-sm md:col-span-1",
                    r.type === "income" ? "text-income" : r.type === "expense" ? "text-expense" : "",
                  )}
                >
                  {r.type === "income" ? "+" : r.type === "expense" ? "−" : ""}
                  {formatCurrency(Number(r.amount))}
                </span>
                <span className="text-right md:col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(r);
                          setDialogOpen(true);
                        }}
                      >
                        Amend
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => remove.mutate(r.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editing} />
    </div>
  );
}
