import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { TECH_OPTIONS, INTENT_LABELS } from "@/lib/constants";
import { LogOut, Save, Github, MapPin, Upload } from "lucide-react";
import { Loader } from "@/components/Loader";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  if (!profile) return <Loader label="Loading profile" />;

  const update = (k: string, v: any) => setProfile({ ...profile, [k]: v });
  const toggleTech = (t: string) => update("tech_stack",
    profile.tech_stack.includes(t) ? profile.tech_stack.filter((x: string) => x !== t) : [...profile.tech_stack, t].slice(0, 8));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatar_url = profile.avatar_url;
      if (avatarFile) {
        const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("profiles").update({
        display_name: profile.display_name,
        bio: profile.bio,
        intent: profile.intent,
        tech_stack: profile.tech_stack,
        github_handle: profile.github_handle,
        location: profile.location,
        years_experience: profile.years_experience,
        gender: profile.gender,
        avatar_url,
      }).eq("id", user.id);
      if (error) throw error;
      setProfile({ ...profile, avatar_url });
      setAvatarFile(null);
      toast({ title: "Saved ✨" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen p-5 pt-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-gradient">Profile</h1>
        <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Sign out</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 space-y-5">
        <div className="flex justify-center">
          <label className="cursor-pointer relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-primary flex items-center justify-center text-4xl font-bold overflow-hidden ring-4 ring-glass-border group-hover:ring-primary transition-all">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" alt="" />
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : profile.display_name[0]}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-glow">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setAvatarFile(e.target.files[0])} />
          </label>
        </div>

        <div>
          <Label>Display name</Label>
          <Input value={profile.display_name} onChange={(e) => update("display_name", e.target.value)}
            className="bg-input/50 border-border" maxLength={40} />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea value={profile.bio ?? ""} onChange={(e) => update("bio", e.target.value)}
            className="bg-input/50 border-border resize-none" rows={3} maxLength={200} />
        </div>

        <div>
          <Label>I'm here for</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {(["date","collab","both"] as const).map((k) => (
              <button key={k} onClick={() => update("intent", k)}
                className={cn("p-2 rounded-xl text-sm border transition-all",
                  profile.intent === k ? "bg-gradient-primary border-primary shadow-glow" : "glass border-glass-border")}>
                <div className="text-lg">{INTENT_LABELS[k].emoji}</div>
                <div className="text-xs">{INTENT_LABELS[k].label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="flex items-center gap-1"><Github className="w-3 h-3" />GitHub</Label>
            <Input value={profile.github_handle ?? ""} onChange={(e) => update("github_handle", e.target.value)}
              className="bg-input/50 border-border font-mono" maxLength={40} placeholder="@handle" />
          </div>
          <div>
            <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" />Location</Label>
            <Input value={profile.location ?? ""} onChange={(e) => update("location", e.target.value)}
              className="bg-input/50 border-border" maxLength={60} placeholder="Berlin" />
          </div>
        </div>

        <div>
          <Label>Years coding</Label>
          <Input type="number" min={0} max={50} value={profile.years_experience ?? 0}
            onChange={(e) => update("years_experience", parseInt(e.target.value) || 0)}
            className="bg-input/50 border-border w-32" />
        </div>

        <div>
          <Label>Gender <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            {([
              { k: "female", label: "Female", emoji: "♀️" },
              { k: "male", label: "Male", emoji: "♂️" },
              { k: "non-binary", label: "Non-binary", emoji: "⚧️" },
              { k: "prefer-not", label: "Prefer not", emoji: "🤐" },
            ] as const).map(({ k, label, emoji }) => (
              <button key={k} type="button" onClick={() => update("gender", profile.gender === k ? null : k)}
                className={cn("p-2 rounded-xl text-sm border transition-all",
                  profile.gender === k ? "bg-gradient-primary border-primary shadow-glow" : "glass border-glass-border")}>
                <div className="text-lg">{emoji}</div>
                <div className="text-xs">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Tech stack <span className="text-muted-foreground text-xs">({profile.tech_stack.length}/8)</span></Label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {TECH_OPTIONS.map((t) => (
              <button key={t} onClick={() => toggleTech(t)}
                className={cn("px-2.5 py-1 rounded-full text-xs font-mono border transition-all",
                  profile.tech_stack.includes(t)
                    ? "bg-gradient-primary text-primary-foreground border-primary"
                    : "glass border-glass-border text-foreground/70")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full h-11 bg-gradient-primary border-0 shadow-glow">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </motion.div>
    </div>
  );
};

export default Profile;
