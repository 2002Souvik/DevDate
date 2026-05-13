import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Eye, Heart, Sparkles, Code2, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Visitor { viewer_id: string; created_at: string; profile?: { display_name: string; avatar_url: string | null }; }

const Stats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    views: 0, likesReceived: 0, likesSent: 0, matches: 0, comments: 0,
  });
  const [topTech, setTopTech] = useState<{ tech: string; count: number }[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // counts in parallel
      const [viewsR, likesRecR, likesSentR, matchesR, commentsR, visitorsR, swipesAllR] = await Promise.all([
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("swipes").select("*", { count: "exact", head: true }).eq("target_id", user.id).eq("liked", true),
        supabase.from("swipes").select("*", { count: "exact", head: true }).eq("swiper_id", user.id).eq("liked", true),
        supabase.from("matches").select("*", { count: "exact", head: true }).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
        supabase.from("profile_comments").select("*", { count: "exact", head: true }).eq("profile_id", user.id),
        supabase.from("profile_views").select("viewer_id, created_at").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("swipes").select("target_id").eq("swiper_id", user.id).eq("liked", true),
      ]);

      setStats({
        views: viewsR.count ?? 0,
        likesReceived: likesRecR.count ?? 0,
        likesSent: likesSentR.count ?? 0,
        matches: matchesR.count ?? 0,
        comments: commentsR.count ?? 0,
      });

      // hydrate visitors
      const visitorIds = Array.from(new Set((visitorsR.data ?? []).map((v) => v.viewer_id)));
      const { data: vp } = await supabase.from("profiles").select("id, display_name, avatar_url")
        .in("id", visitorIds.length ? visitorIds : ["00000000-0000-0000-0000-000000000000"]);
      const vmap = new Map(vp?.map((p) => [p.id, p]) ?? []);
      setRecentVisitors((visitorsR.data ?? []).map((v) => ({ ...v, profile: vmap.get(v.viewer_id) as any })));

      // top tech among people I liked
      const likedIds = Array.from(new Set((swipesAllR.data ?? []).map((s) => s.target_id)));
      if (likedIds.length) {
        const { data: lp } = await supabase.from("profiles").select("tech_stack").in("id", likedIds);
        const counter: Record<string, number> = {};
        (lp ?? []).forEach((p: any) => (p.tech_stack ?? []).forEach((t: string) => { counter[t] = (counter[t] ?? 0) + 1; }));
        setTopTech(Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tech, count]) => ({ tech, count })));
      }

      setLoading(false);
    })();
  }, [user]);

  const matchRate = stats.likesSent ? Math.round((stats.matches / stats.likesSent) * 100) : 0;

  const cards = [
    { label: "Profile views", value: stats.views, icon: Eye, color: "from-blue-500 to-cyan-400" },
    { label: "Likes received", value: stats.likesReceived, icon: Heart, color: "from-pink-500 to-rose-400" },
    { label: "Likes sent", value: stats.likesSent, icon: Sparkles, color: "from-purple-500 to-fuchsia-400" },
    { label: "Matches", value: stats.matches, icon: Users, color: "from-emerald-500 to-teal-400" },
    { label: "Endorsements", value: stats.comments, icon: Code2, color: "from-amber-500 to-orange-400" },
    { label: "Match rate", value: `${matchRate}%`, icon: TrendingUp, color: "from-indigo-500 to-violet-400" },
  ];

  return (
    <div className="min-h-screen p-5 pt-8 pb-32 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-display font-bold text-gradient">Your Stats</h1>
        <p className="text-muted-foreground text-sm mt-1">How your profile is performing</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl glass animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-strong rounded-2xl p-4 relative overflow-hidden"
              >
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${c.color} opacity-30 blur-2xl`} />
                <c.icon className="w-5 h-5 text-primary mb-2 relative" />
                <div className="text-2xl font-display font-bold relative">{c.value}</div>
                <div className="text-xs text-muted-foreground relative">{c.label}</div>
              </motion.div>
            ))}
          </div>

          {topTech.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-strong rounded-3xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="font-display text-lg font-bold">Your taste in stacks</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Tech most common among devs you liked</p>
              <div className="space-y-2">
                {topTech.map((t) => {
                  const max = topTech[0].count;
                  const pct = (t.count / max) * 100;
                  return (
                    <div key={t.tech}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono">{t.tech}</span>
                        <span className="text-muted-foreground">{t.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-primary shadow-glow"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-strong rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Recent visitors</h3>
            </div>
            {recentVisitors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No visitors yet — get out there!</p>
            ) : (
              <div className="space-y-2">
                {recentVisitors.map((v, i) => (
                  <button
                    key={`${v.viewer_id}-${i}`}
                    onClick={() => navigate(`/u/${v.viewer_id}`)}
                    className="w-full glass rounded-xl p-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    {v.profile?.avatar_url ? (
                      <img src={v.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm">
                        {v.profile?.display_name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{v.profile?.display_name ?? "Someone"}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
};

export default Stats;
