import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Code2, Heart, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 chars").max(72),
  displayName: z.string().trim().min(2, "Min 2 chars").max(40).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-fill display name from email if blank on signup
    const finalDisplayName = mode === "signup"
      ? (displayName.trim() || email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dev")
      : undefined;
    const validation = schema.safeParse({ email, password, displayName: mode === "signup" ? finalDisplayName : undefined });
    if (!validation.success) {
      toast({ title: "Hold up", description: validation.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/discover`,
            data: { display_name: finalDisplayName },
          },
        });
        if (error) throw error;
        // If session is missing (email confirmation required), try direct sign-in
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            toast({ title: "Check your inbox", description: "Confirm your email to continue." });
            return;
          }
        }
        toast({ title: "Welcome to Devdate ✨", description: "Let's set up your profile." });
        navigate("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast({ title: "Email not confirmed", description: "Check your inbox, or sign up again — confirmation is now disabled.", variant: "destructive" });
            return;
          }
          throw error;
        }
        navigate("/discover");
      }
    } catch (err: any) {
      toast({ title: "Oops", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/discover` },
    });
    if (error) toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="aurora-orb w-[500px] h-[500px] -top-40 -left-40 bg-primary/50" />
      <div className="aurora-orb w-[600px] h-[600px] -bottom-40 -right-40 bg-secondary/40" />
      <div className="aurora-orb w-[400px] h-[400px] top-1/2 left-1/2 bg-accent/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md glass-strong rounded-3xl p-8"
      >
        <div className="flex items-center justify-center mb-6">
          <Logo size="lg" />
        </div>
        <p className="text-center text-muted-foreground mb-8 text-sm">
          {mode === "signup" ? "Where developers find their match — in love and code." : "Welcome back, dev."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Display name <span className="text-muted-foreground text-xs">(optional — we'll use your email)</span></Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada Lovelace" className="bg-input/50 border-border h-11" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dev.com" className="bg-input/50 border-border h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="bg-input/50 border-border h-11" />
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-12 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow border-0">
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "..." : mode === "signup" ? "Start matching" : "Sign in"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/50 backdrop-blur-sm px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogle}
            className="w-full h-12 glass border-glass-border hover:bg-muted/30">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-primary hover:text-primary-glow font-medium underline-offset-4 hover:underline">
            {mode === "signup" ? "Sign in" : "Sign up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
