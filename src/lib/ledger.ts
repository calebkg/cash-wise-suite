import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TxType = "income" | "expense" | "transfer";

export type Account = {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit_card" | "savings" | "investment";
  balance: number;
  color: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  budget_limit: number | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TxType;
  date: string;
  description: string | null;
  tags: string[];
  receipt_url: string | null;
  is_recurring: boolean;
  account_id: string | null;
  category_id: string | null;
  created_at: string;
};

export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "credit_card", label: "Credit card" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
] as const;

export const TX_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
] as const;

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () =>
      unwrap<Account[]>(
        (await supabase.from("accounts").select("*").order("created_at")) as never,
      ),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      unwrap<Category[]>(
        (await supabase.from("categories").select("*").order("name")) as never,
      ),
  });
}

export type TxFilters = {
  search?: string;
  type?: TxType | "all";
  categoryId?: string | "all";
  accountId?: string | "all";
  from?: string;
  to?: string;
};

export function useTransactions(filters: TxFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*").order("date", { ascending: false });
      if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
      if (filters.categoryId && filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
      if (filters.accountId && filters.accountId !== "all") q = q.eq("account_id", filters.accountId);
      if (filters.from) q = q.gte("date", filters.from);
      if (filters.to) q = q.lte("date", filters.to);
      if (filters.search) q = q.ilike("description", `%${filters.search}%`);
      return unwrap<Transaction[]>((await q.limit(500)) as never);
    },
  });
}

function useLedgerMutation<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  successMessage: string,
  keys: string[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useSaveAccount() {
  return useLedgerMutation<Partial<Account> & { id?: string }>(
    async (values) => {
      const payload = {
        name: values.name!,
        type: values.type ?? "bank",
        balance: Number(values.balance ?? 0),
        color: values.color ?? "#c9a84c",
      };
      const res = values.id
        ? await supabase.from("accounts").update(payload).eq("id", values.id)
        : await supabase.from("accounts").insert({ ...payload, user_id: await currentUserId() });
      if (res.error) throw new Error(res.error.message);
    },
    "Account saved",
    ["accounts"],
  );
}

export function useDeleteAccount() {
  return useLedgerMutation<string>(
    async (id) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    "Account removed",
    ["accounts", "transactions"],
  );
}

export function useSaveCategory() {
  return useLedgerMutation<Partial<Category> & { id?: string }>(
    async (values) => {
      const payload = {
        name: values.name!,
        type: values.type ?? "expense",
        icon: values.icon ?? "circle",
        color: values.color ?? "#c9a84c",
        budget_limit: values.budget_limit ?? null,
      };
      const res = values.id
        ? await supabase.from("categories").update(payload).eq("id", values.id)
        : await supabase.from("categories").insert({ ...payload, user_id: await currentUserId() });
      if (res.error) throw new Error(res.error.message);
    },
    "Category saved",
    ["categories"],
  );
}

export function useDeleteCategory() {
  return useLedgerMutation<string>(
    async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    "Category removed",
    ["categories", "transactions"],
  );
}

export function useSaveTransaction() {
  return useLedgerMutation<Partial<Transaction> & { id?: string }>(
    async (values) => {
      const payload = {
        amount: Number(values.amount ?? 0),
        type: values.type ?? "expense",
        date: values.date ?? new Date().toISOString().slice(0, 10),
        description: values.description ?? null,
        tags: values.tags ?? [],
        receipt_url: values.receipt_url ?? null,
        account_id: values.account_id || null,
        category_id: values.category_id || null,
      };
      const res = values.id
        ? await supabase.from("transactions").update(payload).eq("id", values.id)
        : await supabase.from("transactions").insert({ ...payload, user_id: await currentUserId() });
      if (res.error) throw new Error(res.error.message);
    },
    "Entry recorded",
    ["transactions"],
  );
}

export function useDeleteTransaction() {
  return useLedgerMutation<string>(
    async (id) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    "Entry deleted",
    ["transactions"],
  );
}

export async function uploadReceipt(file: File) {
  const userId = await currentUserId();
  const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function receiptUrl(path: string) {
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export function toCsv(rows: Transaction[], categories: Category[], accounts: Account[]) {
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "";
  const accName = (id: string | null) => accounts.find((a) => a.id === id)?.name ?? "";
  const head = ["date", "type", "amount", "category", "account", "description", "tags"];
  const body = rows.map((r) =>
    [
      r.date,
      r.type,
      r.amount,
      catName(r.category_id),
      accName(r.account_id),
      (r.description ?? "").replace(/"/g, '""'),
      (r.tags ?? []).join("|"),
    ]
      .map((v) => `"${String(v)}"`)
      .join(","),
  );
  return [head.join(","), ...body].join("\n");
}
