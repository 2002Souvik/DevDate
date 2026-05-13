import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { TECH_OPTIONS, INTEREST_OPTIONS, INTENT_LABELS } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Intent", "Stack", "Vibe", "Profile"];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<"date" | "collab" | "both">("both");
  const [stack, setStack] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [github, setGithub] = useState("");
  const [years, setYears] = useState(2);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], v: string, max: number) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : arr.length < max ? [...arr, v] : arr;

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5_000_000) { toast({ title: "Too large", description: "Max 5MB", variant: "destructive" }); return; }
    setAvatar(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const next = () => {
    if (step === 1 && stack.length < 2) { toast({ title: "Pick at least 2 techs" }); return; }
    if (step === 3 && displayName.trim().length < 2) { toast({ title: "Add a display name" }); return; }
    if (step < 3) setStep(step + 1); else save();
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatar_url: string | null = null;
      if (avatar) {
        const path = `${user.id}/${Date.now()}-${avatar.name}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatar, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = data.publicUrl;
      }
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { error } = await supabase.from("profiles").update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        intent, tech_stack: stack, interests,
        github_handle: github.trim() || null,
        years_experience: years,
        timezone: tz,
        avatar_url,
        onboarded: true,
      }).eq("id", user.id);
      if (error) throw error;
      toast({ title: "You're in ✨", description: "Time to find your match." });
      navigate("/discover");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                i <= step ? "bg-gradient-primary w-8 shadow-glow" : "bg-muted"
              )} />
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-6 sm:p-8 min-h-[480px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">What are you here for?</h2>
                  <p className="text-muted-foreground text-sm mb-6">You can change this anytime.</p>
                  <div className="space-y-3">
                    {(["date", "collab", "both"] as const).map((k) => (
                      <button key={k} onClick={() => setIntent(k)}
                        className={cn(
                          "w-full p-4 rounded-2xl text-left transition-all border",
                          intent === k ? "bg-gradient-primary border-primary shadow-glow" : "glass border-glass-border hover:border-primary/40"
                        )}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{INTENT_LABELS[k].emoji}</span>
                          <div>
                            <div className="font-semibold">{INTENT_LABELS[k].label}</div>
                            <div className="text-xs text-muted-foreground">{INTENT_LABELS[k].desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Your tech stack</h2>
                  <p className="text-muted-foreground text-sm mb-6">Pick up to 8 — {stack.length}/8</p>
                  <div className="flex flex-wrap gap-2">
                    {TECH_OPTIONS.map((t) => (
                      <button key={t} onClick={() => setStack(toggle(stack, t, 8))}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-mono transition-all border",
                          stack.includes(t)
                            ? "bg-gradient-primary text-primary-foreground border-primary shadow-glow"
                            : "glass border-glass-border hover:border-primary/40 text-foreground/80"
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Outside the IDE?</h2>
                  <p className="text-muted-foreground text-sm mb-6">Pick up to 6 — {interests.length}/6</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((t) => (
                      <button key={t} onClick={() => setInterests(toggle(interests, t, 6))}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-all border",
                          interests.includes(t)
                            ? "bg-gradient-secondary text-secondary-foreground border-secondary shadow-glow"
                            : "glass border-glass-border hover:border-secondary/40"
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-display font-bold mb-2">One last thing</h2>
                  <div className="flex justify-center">
                    <label className="cursor-pointer group">
                      <div className="w-24 h-24 rounded-full glass border-2 border-glass-border flex items-center justify-center overflow-hidden relative group-hover:border-primary transition-colors">
                        {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                    </label>
                  </div>
                  <div>
                    <Label>Display name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40}
                      className="bg-input/50 border-border h-11" placeholder="How devs will know you" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>GitHub <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input value={github} onChange={(e) => setGithub(e.target.value)} maxLength={40}
                        className="bg-input/50 border-border h-11 font-mono" placeholder="@handle" />
                    </div>
                    <div>
                      <Label>Years coding</Label>
                      <Input type="number" min={0} max={50} value={years} onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                        className="bg-input/50 border-border h-11" />
                    </div>
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200}
                      className="bg-input/50 border-border resize-none" rows={3}
                      placeholder="Building things that matter. Coffee-powered." />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="glass border-glass-border">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={next} disabled={saving}
              className="flex-1 h-11 bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow border-0">
              {step === 3 ? (saving ? "Saving..." : <>Finish <Check className="w-4 h-4 ml-2" /></>) : <>Next <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
