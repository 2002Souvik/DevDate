import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

const PRESETS = [
  "Your tech stack is fire 🔥",
  "Love your bio — let's build!",
  "Down to pair-program?",
  "Coffee + code sometime?",
  "Your GitHub is impressive 💯",
];

export const ComplimentModal = ({ open, onClose, profileId, profileName }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (msg: string) => {
    if (!user || !msg.trim()) return;
    setSending(true);
    const { error } = await supabase.from("profile_comments").insert({
      profile_id: profileId,
      author_id: user.id,
      content: `💬 ${msg.trim().slice(0, 280)}`,
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Compliment sent ✨", description: `${profileName} will see it on their profile.` });
    setText("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl p-6 w-full max-w-md space-y-4 shadow-glow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-glow" />
                Send a compliment
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground">Drop a quick note on {profileName}'s profile.</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => send(p)} disabled={sending}
                  className="text-xs px-3 py-1.5 rounded-full glass hover:bg-primary/20 transition-colors">
                  {p}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <textarea
                value={text} onChange={(e) => setText(e.target.value)} maxLength={280}
                placeholder="Write your own…"
                className="w-full bg-input/50 border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <Button onClick={() => send(text)} disabled={!text.trim() || sending}
                className="w-full bg-gradient-primary border-0 shadow-glow">
                {sending ? "Sending…" : "Send compliment"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
