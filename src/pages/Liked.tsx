import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, RotateCcw, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ComplimentModal } from "@/components/ComplimentModal";

interface Row {
  swipeId?: string;
  profile: { id: string; display_name: string; avatar_url: string | null; tech_stack: string[]; bio: string | null };
}

const Liked = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState<Row[]>([]);
  const [skipped, setSkipped] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [compliment, setCompliment] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: swipes } = await supabase.from("swipes")
      .select("id, target_id, liked").eq("swiper_id", user.id);
    const ids = (swipes ?? []).map((s) => s.target_id);
    if (ids.length === 0) { setLiked([]); setSkipped([]); setLoading(false); return; }
    const { data: profiles } = await supabase.from("profiles")
      .select("id, display_name, avatar_url, tech_stack, bio").in("id", ids);
    const pmap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    const likedRows: Row[] = [], skippedRows: Row[] = [];
    (swipes ?? []).forEach((s) => {
      const p = pmap.get(s.target_id);
      if (!p) return;
      const row = { swipeId: s.id, profile: p as any };
      if (s.liked) likedRows.push(row); else skippedRows.push(row);
    });
    setLiked(likedRows); setSkipped(skippedRows); setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const recheck = async (swipeId: string) => {
    const { error } = await supabase.from("swipes").delete().eq("id", swipeId);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Back in the deck ✨", description: "They'll show up again on Discover." });
    load();
  };

  const renderGrid = (rows: Row[], emptyText: string, isLiked: boolean) => {
    if (loading) return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl glass animate-pulse" />)}
      </div>
    );
    if (rows.length === 0) return (
      <div className="glass-strong rounded-3xl p-8 text-center mt-8">
        <Sparkles className="w-10 h-10 mx-auto text-primary mb-3 animate-float" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {rows.map((r, i) => (
          <motion.div key={r.swipeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-strong group">
            <button onClick={() => navigate(`/u/${r.profile.id}`)} className="absolute inset-0">
              {r.profile.avatar_url ? (
                <img src={r.profile.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-4xl font-bold">{r.profile.display_name[0]}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-12 left-0 right-0 p-3 text-left">
                <p className="font-display font-semibold truncate">{r.profile.display_name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{r.profile.tech_stack?.[0]}</p>
              </div>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1.5">
              {isLiked ? (
                <Button size="sm" variant="secondary" onClick={() => setCompliment({ id: r.profile.id, name: r.profile.display_name })}
                  className="flex-1 h-8 text-xs gap-1 glass">
                  <MessageSquare className="w-3 h-3" /> Compliment
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => recheck(r.swipeId!)}
                  className="flex-1 h-8 text-xs gap-1 glass">
                  <RotateCcw className="w-3 h-3" /> Re-check
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-5 pt-8">
      <header className="mb-4">
        <h1 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
          <Heart className="w-7 h-7 text-primary fill-current" /> Your swipes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Revisit the devs you've liked or passed on.</p>
      </header>

      <Tabs defaultValue="liked">
        <TabsList className="glass w-full">
          <TabsTrigger value="liked" className="flex-1">Liked ({liked.length})</TabsTrigger>
          <TabsTrigger value="skipped" className="flex-1">Skipped ({skipped.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="liked">{renderGrid(liked, "No likes yet — head to Discover!", true)}</TabsContent>
        <TabsContent value="skipped">{renderGrid(skipped, "You haven't passed on anyone yet.", false)}</TabsContent>
      </Tabs>

      {compliment && (
        <ComplimentModal open={!!compliment} onClose={() => setCompliment(null)}
          profileId={compliment.id} profileName={compliment.name} />
      )}
    </div>
  );
};

export default Liked;
