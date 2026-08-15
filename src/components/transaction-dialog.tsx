import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  TX_TYPES,
  uploadReceipt,
  useAccounts,
  useCategories,
  useSaveTransaction,
  type Transaction,
  type TxType,
} from "@/lib/ledger";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionDialog({ open, onOpenChange, transaction }: Props) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const save = useSaveTransaction();

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [accountId, setAccountId] = useState("none");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType((transaction?.type as TxType) ?? "expense");
    setAmount(transaction ? String(transaction.amount) : "");
    setDate(transaction?.date?.slice(0, 10) ?? today());
    setDescription(transaction?.description ?? "");
    setTags((transaction?.tags ?? []).join(", "));
    setCategoryId(transaction?.category_id ?? "none");
    setAccountId(transaction?.account_id ?? "none");
    setReceipt(transaction?.receipt_url ?? null);
  }, [open, transaction]);

  const relevantCategories = categories.filter((c) =>
    type === "transfer" ? true : c.type === type,
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      setReceipt(await uploadReceipt(file));
      toast.success("Receipt attached");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    await save.mutateAsync({
      id: transaction?.id,
      type,
      amount: value,
      date,
      description: description.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      category_id: categoryId === "none" ? null : categoryId,
      account_id: accountId === "none" ? null : accountId,
      receipt_url: receipt,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {transaction ? "Amend entry" : "New entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-3 gap-px border border-border bg-border">
            {TX_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={
                  "label-eyebrow bg-card px-3 py-3 transition-colors " +
                  (type === t.value ? "bg-accent text-accent-foreground" : "hover:text-foreground")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="decimal"
                className="numeral rounded-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                className="numeral rounded-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {relevantCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              className="rounded-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              className="rounded-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="label-eyebrow">
              {receipt ? "Receipt attached" : "No receipt"}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs hover:border-primary">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
              Attach receipt
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-none" onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {transaction ? "Save changes" : "Record entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
