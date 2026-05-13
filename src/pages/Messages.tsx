import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatRow {
  matchId: string;
  other: { id: string; display_name: string; avatar_url: string | null };
  lastMessage: string | null;
  lastAt: string | null;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ms } = await supabase.from("matches").select("id, user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const otherIds = (ms ?? []).map((m) => m.user1_id === user.id ? m.user2_id : m.user1_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url")
        .in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
      const pmap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      const rows: ChatRow[] = await Promise.all((ms ?? []).map(async (m) => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
        const { data: lm } = await supabase.from("messages").select("content, created_at, is_code")
          .eq("match_id", m.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        return {
          matchId: m.id,
          other: pmap.get(otherId) as any,
          lastMessage: lm ? (lm.is_code ? "📦 sent a snippet" : lm.content) : null,
          lastAt: lm?.created_at ?? null,
        };
      }));
      rows.sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
      setChats(rows.filter((r) => r.other));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen p-5 pt-8">
      <h1 className="text-3xl font-display font-bold text-gradient mb-6">Chats</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl glass animate-pulse" />)}</div>
      ) : chats.length === 0 ? (
        <div className="glass-strong rounded-3xl p-8 text-center mt-12">
          <MessageCircle className="w-12 h-12 mx-auto text-primary mb-3 animate-float" />
          <h3 className="font-display text-lg font-bold mb-1">No chats yet</h3>
          <p className="text-sm text-muted-foreground">Match with someone to start a conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((c) => (
            <button key={c.matchId} onClick={() => navigate(`/chat/${c.matchId}`)}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
              {c.other.avatar_url ? (
                <img src={c.other.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center font-bold">{c.other.display_name[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{c.other.display_name}</p>
                  {c.lastAt && <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDistanceToNow(new Date(c.lastAt), { addSuffix: false })}</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.lastMessage ?? "Say hi 👋"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
