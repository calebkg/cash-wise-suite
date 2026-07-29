
-- ============ ENUMS ============
CREATE TYPE public.account_type AS ENUM ('checking','savings','credit','cash');
CREATE TYPE public.category_type AS ENUM ('income','expense');
CREATE TYPE public.transaction_type AS ENUM ('income','expense','transfer');
CREATE TYPE public.recurring_frequency AS ENUM ('daily','weekly','monthly','yearly');
CREATE TYPE public.invite_role AS ENUM ('viewer','editor');
CREATE TYPE public.invite_status AS ENUM ('pending','accepted','declined');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  currency_preference TEXT NOT NULL DEFAULT 'USD',
  monthly_budget_limit NUMERIC(14,2),
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============ USER ROLES (workspace access) ============
-- workspace_owner_id = the owner whose data is being shared
-- user_id = the collaborator receiving access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.invite_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_owner_id, user_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_involved" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR workspace_owner_id = auth.uid());

-- Security definer: does user have any role (viewer/editor) in owner's workspace?
CREATE OR REPLACE FUNCTION public.has_workspace_access(_owner UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = _user OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE workspace_owner_id = _owner AND user_id = _user
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_edit(_owner UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _owner = _user OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE workspace_owner_id = _owner AND user_id = _user AND role = 'editor'
  );
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#6366f1',
  type public.category_type NOT NULL DEFAULT 'expense',
  budget_limit NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX categories_user_idx ON public.categories(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (public.has_workspace_access(user_id, auth.uid()));
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated USING (public.has_workspace_edit(user_id, auth.uid())) WITH CHECK (public.has_workspace_edit(user_id, auth.uid()));
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ ACCOUNTS ============
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.account_type NOT NULL DEFAULT 'checking',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX accounts_user_idx ON public.accounts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select" ON public.accounts FOR SELECT TO authenticated USING (public.has_workspace_access(user_id, auth.uid()));
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE TO authenticated USING (public.has_workspace_edit(user_id, auth.uid())) WITH CHECK (public.has_workspace_edit(user_id, auth.uid()));
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  type public.transaction_type NOT NULL DEFAULT 'expense',
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  receipt_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_date_idx ON public.transactions(user_id, date DESC);
CREATE INDEX transactions_category_idx ON public.transactions(category_id);
CREATE INDEX transactions_account_idx ON public.transactions(account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated USING (public.has_workspace_access(user_id, auth.uid()));
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_workspace_edit(user_id, auth.uid()));
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE TO authenticated USING (public.has_workspace_edit(user_id, auth.uid())) WITH CHECK (public.has_workspace_edit(user_id, auth.uid()));
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE TO authenticated USING (public.has_workspace_edit(user_id, auth.uid()));

-- ============ RECURRING RULES ============
CREATE TABLE public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  frequency public.recurring_frequency NOT NULL DEFAULT 'monthly',
  next_due_date DATE NOT NULL,
  description TEXT,
  type public.transaction_type NOT NULL DEFAULT 'expense',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recurring_user_idx ON public.recurring_rules(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_rules TO authenticated;
GRANT ALL ON public.recurring_rules TO service_role;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_select" ON public.recurring_rules FOR SELECT TO authenticated USING (public.has_workspace_access(user_id, auth.uid()));
CREATE POLICY "recurring_insert" ON public.recurring_rules FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "recurring_update" ON public.recurring_rules FOR UPDATE TO authenticated USING (public.has_workspace_edit(user_id, auth.uid())) WITH CHECK (public.has_workspace_edit(user_id, auth.uid()));
CREATE POLICY "recurring_delete" ON public.recurring_rules FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ TEAM INVITES ============
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role public.invite_role NOT NULL DEFAULT 'viewer',
  status public.invite_status NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invites_owner_idx ON public.team_invites(workspace_owner_id);
CREATE INDEX invites_email_idx ON public.team_invites(invited_email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_owner_or_invitee" ON public.team_invites FOR SELECT TO authenticated
  USING (workspace_owner_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "invites_insert_owner" ON public.team_invites FOR INSERT TO authenticated WITH CHECK (workspace_owner_id = auth.uid());
CREATE POLICY "invites_delete_owner" ON public.team_invites FOR DELETE TO authenticated USING (workspace_owner_id = auth.uid());
CREATE POLICY "invites_update_invitee" ON public.team_invites FOR UPDATE TO authenticated
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============ AUTO-CREATE PROFILE + SEED CATEGORIES ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- seed a few default categories
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Salary',       'Wallet',      '#10b981', 'income'),
    (NEW.id, 'Food & Dining','Utensils',    '#f59e0b', 'expense'),
    (NEW.id, 'Transport',    'Car',         '#3b82f6', 'expense'),
    (NEW.id, 'Shopping',     'ShoppingBag', '#ec4899', 'expense'),
    (NEW.id, 'Bills',        'Receipt',     '#ef4444', 'expense'),
    (NEW.id, 'Entertainment','Film',        '#8b5cf6', 'expense');

  -- seed a default cash account
  INSERT INTO public.accounts (user_id, name, type, balance, color)
  VALUES (NEW.id, 'Cash', 'cash', 0, '#10b981');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-accept invites when the invited user signs up: give them workspace role
CREATE OR REPLACE FUNCTION public.accept_matching_invites()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (workspace_owner_id, user_id, role)
  SELECT workspace_owner_id, NEW.id, role FROM public.team_invites
  WHERE lower(invited_email) = lower(NEW.email) AND status = 'pending'
  ON CONFLICT DO NOTHING;

  UPDATE public.team_invites SET status = 'accepted'
  WHERE lower(invited_email) = lower(NEW.email) AND status = 'pending';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_accept_invites ON auth.users;
CREATE TRIGGER on_auth_user_accept_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.accept_matching_invites();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
