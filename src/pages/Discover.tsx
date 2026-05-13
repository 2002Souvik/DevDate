import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SwipeCard, ProfileCardData } from "@/components/SwipeCard";
import { computeCompatibility } from "@/lib/compat";
import { toast } from "@/hooks/use-toast";
import { Code2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/Loader";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<ProfileCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState<ProfileCardData | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: swipes } = await supabase.from("swipes").select("target_id").eq("swiper_id", user.id);
    const swiped = new Set((swipes ?? []).map((s) => s.target_id));
    swiped.add(user.id);

    const { data: profiles } = await supabase.from("profiles").select("*").eq("onboarded", true).limit(50);
    const filtered = (profiles ?? [])
      .filter((p) => !swiped.has(p.id))
      .map((p): ProfileCardData => ({
        id: p.id,
        display_name: p.display_name,
        bio: p.bio ?? "",
        intent: p.intent,
        tech_stack: p.tech_stack ?? [],
        interests: p.interests ?? [],
        github_handle: p.github_handle,
        location: p.location,
        years_experience: p.years_experience,
        avatar_url: p.avatar_url,
        compat: me ? computeCompatibility(me as any, p as any) : 50,
      }))
      .sort((a, b) => b.compat - a.compat);
    setDeck(filtered);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSwipe = async (dir: "left" | "right") => {
    if (!user || deck.length === 0) return;
    const target = deck[0];
    setDeck((d) => d.slice(1));
    const liked = dir === "right";
    const { error } = await supabase.from("swipes").insert({
      swiper_id: user.id, target_id: target.id, liked,
    });
    if (error) { toast({ title: "Swipe failed", description: error.message, variant: "destructive" }); return; }
    if (liked) {
      // Check for new match
      const { data: matches } = await supabase
        .from("matches").select("*")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${target.id}),and(user1_id.eq.${target.id},user2_id.eq.${user.id})`)
        .limit(1);
      if (matches && matches.length > 0) {
        setMatchPopup(target);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-5 pt-6">
        <Logo size="md" />
        <Button variant="ghost" size="icon" onClick={load} className="rounded-full">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm aspect-[3/4.2] mb-12">
          {loading ? (
            <div className="w-full h-full glass-strong rounded-3xl flex items-center justify-center">
              <Loader label="Finding devs" fullscreen={false} />
            </div>
          ) : deck.length === 0 ? (
            <div className="w-full h-full glass-strong rounded-3xl flex flex-col items-center justify-center text-center p-8 gap-3">
              <Sparkles className="w-12 h-12 text-primary animate-float" />
              <h3 className="font-display text-xl font-bold">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground">Check back soon for fresh devs to swipe on.</p>
              <Button onClick={load} variant="outline" className="glass mt-2">Refresh</Button>
            </div>
          ) : (
            <AnimatePresence>
              {deck.slice(0, 3).reverse().map((p, i, arr) => (
                <SwipeCard key={p.id} profile={p} index={arr.length - 1 - i} isTop={i === arr.length - 1} onSwipe={handleSwipe} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Match modal */}
      <AnimatePresence>
        {matchPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setMatchPopup(null)}>
            <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-strong rounded-3xl p-8 max-w-sm text-center space-y-4 shadow-glow"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-4xl font-display font-bold text-gradient">It's a Match!</h2>
              <p className="text-muted-foreground">You and {matchPopup.display_name} liked each other.</p>
              <div className="flex justify-center">
                {matchPopup.avatar_url ? (
                  <img src={matchPopup.avatar_url} className="w-28 h-28 rounded-full object-cover ring-4 ring-primary shadow-glow" alt="" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-primary flex items-center justify-center text-4xl font-bold ring-4 ring-primary shadow-glow">
                    {matchPopup.display_name[0]}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 glass" onClick={() => setMatchPopup(null)}>Keep swiping</Button>
                <Button className="flex-1 bg-gradient-primary border-0 shadow-glow" onClick={() => navigate("/messages")}>Say hi</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
