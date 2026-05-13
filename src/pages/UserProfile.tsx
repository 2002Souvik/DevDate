import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Github, MapPin, MessageCircle, Send, Trash2, Sparkles, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { INTENT_LABELS } from "@/lib/constants";
import { ComplimentModal } from "@/components/ComplimentModal";
import { Loader } from "@/components/Loader";

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { display_name: string; avatar_url: string | null };
}

const UserProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const isMe = user?.id === id;
  const [complimentOpen, setComplimentOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      setProfile(p);

      // record view (silent fail if same user)
      if (user.id !== id) {
        await supabase.from("profile_views").insert({ profile_id: id, viewer_id: user.id });
      }

      await loadComments();
    })();

    const ch = supabase
      .channel(`comments:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_comments", filter: `profile_id=eq.${id}` },
        () => loadComments()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const loadComments = async () => {
    if (!id) return;
    const { data: cs } = await supabase
      .from("profile_comments")
      .select("id, author_id, content, created_at")
      .eq("profile_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    const authorIds = Array.from(new Set((cs ?? []).map((c) => c.author_id)));
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds.length ? authorIds : ["00000000-0000-0000-0000-000000000000"]);
    const amap = new Map(authors?.map((a) => [a.id, a]) ?? []);
    setComments((cs ?? []).map((c) => ({ ...c, author: amap.get(c.author_id) as any })));
  };

  const post = async () => {
    if (!user || !id || !text.trim()) return;
    setPosting(true);
    const content = text.trim().slice(0, 500);
    const { error } = await supabase.from("profile_comments").insert({
      profile_id: id, author_id: user.id, content,
    });
    setPosting(false);
    if (error) {
      toast({ title: "Couldn't post", description: error.message, variant: "destructive" });
      return;
    }
    setText("");
    toast({ title: "Comment posted ✨" });
  };

  const remove = async (cid: string) => {
    const { error } = await supabase.from("profile_comments").delete().eq("id", cid);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  };

  if (!profile) {
    return <Loader label="Loading dev" />;
  }

  const intent = INTENT_LABELS[profile.intent as keyof typeof INTENT_LABELS];

  return (
    <div className="min-h-screen pb-32">
      <header className="glass-strong sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b border-glass-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-lg font-bold">@{profile.display_name}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-5 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-24 h-24 rounded-2xl object-cover ring-2 ring-glass-border" alt="" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold ring-2 ring-glass-border">
                {profile.display_name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-display font-bold truncate">{profile.display_name}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>
                )}
                {profile.github_handle && (
                  <a href={`https://github.com/${profile.github_handle}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Github className="w-3 h-3" />@{profile.github_handle}
                  </a>
                )}
                <span>{profile.years_experience ?? 0} yrs</span>
              </div>
              {intent && (
                <div className="inline-flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1 rounded-full bg-gradient-primary/20 border border-primary/30">
                  <span>{intent.emoji}</span><span className="font-medium">{intent.label}</span>
                </div>
              )}
            </div>
          </div>

          {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

          {profile.tech_stack?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.tech_stack.map((t: string) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs font-mono glass border border-glass-border">{t}</span>
              ))}
            </div>
          )}

          {!isMe && (
            <Button onClick={() => setComplimentOpen(true)}
              className="w-full bg-gradient-primary border-0 shadow-glow gap-2">
              <Heart className="w-4 h-4 fill-current" /> Send a compliment
            </Button>
          )}
        </motion.div>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl font-bold">Endorsements</h3>
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          </div>

          {!isMe && (
            <div className="glass rounded-2xl p-3 mb-4 space-y-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Leave an endorsement for ${profile.display_name}...`}
                rows={2}
                maxLength={500}
                className="bg-input/40 border-border resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{text.length}/500</span>
                <Button
                  onClick={post}
                  disabled={!text.trim() || posting}
                  size="sm"
                  className="bg-gradient-primary border-0 shadow-glow"
                >
                  <Send className="w-3 h-3 mr-1" />
                  {posting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {comments.length === 0 ? (
                <div className="glass-strong rounded-2xl p-6 text-center">
                  <Sparkles className="w-8 h-8 mx-auto text-primary mb-2 opacity-60" />
                  <p className="text-sm text-muted-foreground">No endorsements yet. Be the first 🌟</p>
                </div>
              ) : comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass rounded-2xl p-3 flex gap-3"
                >
                  {c.author?.avatar_url ? (
                    <img src={c.author.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {c.author?.display_name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.author?.display_name ?? "Unknown"}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {c.author_id === user?.id && (
                        <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-0.5 break-words whitespace-pre-wrap">{c.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {!isMe && id && (
        <ComplimentModal
          open={complimentOpen}
          onClose={() => setComplimentOpen(false)}
          profileId={id}
          profileName={profile.display_name}
        />
      )}
    </div>
  );
};

export default UserProfile;
