import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — SpendWise" },
      { name: "description", content: "Sign in or create your SpendWise account." },
      { property: "og:title", content: "Sign in — SpendWise" },
      { property: "og:description", content: "Sign in or create your SpendWise account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [loading, setLoading] = useState<null | "email" | "google" | "magic">(null);

  // If already signed in, bounce to dashboard.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  async function handleGoogle() {
    setLoading("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setLoading(null);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    const parsed = z.object({
      email: z.string().trim().email(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    }).safeParse({ email: signInEmail, password: signInPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      setLoading(null);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    const parsed = z.object({
      full_name: z.string().trim().min(1, "Name required").max(100),
      email: z.string().trim().email(),
      password: z.string().min(8, "Use at least 8 characters"),
    }).safeParse({ full_name: signUpName, email: signUpEmail, password: signUpPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      setLoading(null);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleMagicLink() {
    if (!signInEmail) {
      toast.error("Enter your email first");
      return;
    }
    setLoading("magic");
    const { error } = await supabase.auth.signInWithOtp({
      email: signInEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(null);
    if (error) return toast.error(error.message);
    toast.success("Magic link sent — check your inbox.");
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight">SpendWise</span>
        </Link>

        <Card className="w-full p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6 space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="in-email">Email</Label>
                  <Input id="in-email" type="email" autoComplete="email"
                    value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="in-pw">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                      Forgot?
                    </Link>
                  </div>
                  <Input id="in-pw" type="password" autoComplete="current-password"
                    value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading !== null}>
                  {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
              <Button type="button" variant="ghost" size="sm" className="w-full"
                onClick={handleMagicLink} disabled={loading !== null}>
                {loading === "magic" ? "Sending…" : "Email me a magic link"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="up-name">Full name</Label>
                  <Input id="up-name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="up-email">Email</Label>
                  <Input id="up-email" type="email" autoComplete="email"
                    value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="up-pw">Password</Label>
                  <Input id="up-pw" type="password" autoComplete="new-password"
                    value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading !== null}>
                  {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full gap-2"
            onClick={handleGoogle} disabled={loading !== null}>
            <GoogleIcon />
            Google
          </Button>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
