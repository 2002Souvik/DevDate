import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";

interface MatchRow { id: string; other: { id: string; display_name: string; avatar_url: string | null; tech_stack: string[]; }; }

const Matches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("matches").select("id, user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const otherIds = (data ?? []).map((m) => m.user1_id === user.id ? m.user2_id : m.user1_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url, tech_stack").in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
      const pmap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
      setMatches((data ?? []).map((m) => ({
        id: m.id,
        other: pmap.get(m.user1_id === user.id ? m.user2_id : m.user1_id) as any,
      })).filter((m) => m.other));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen p-5 pt-8">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold text-gradient">Matches</h1>
        <p className="text-muted-foreground text-sm mt-1">{matches.length} mutual likes</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl glass animate-pulse" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-strong rounded-3xl p-8 text-center mt-12">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-3 animate-float" />
          <h3 className="font-display text-lg font-bold mb-1">No matches yet</h3>
          <p className="text-sm text-muted-foreground">Keep swiping — your match is out there.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {matches.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/chat/${m.id}`)}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-strong group"
            >
              {m.other.avatar_url ? (
                <img src={m.other.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-4xl font-bold">{m.other.display_name[0]}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-display font-semibold truncate">{m.other.display_name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{m.other.tech_stack?.[0]}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;
