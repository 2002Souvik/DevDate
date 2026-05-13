import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Code2, X, Paperclip, Trash2, MonitorUp, MonitorOff, FileText, Image as ImageIcon, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_code: boolean;
  language: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

const Chat = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [other, setOther] = useState<{ id: string; display_name: string; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [language, setLanguage] = useState("typescript");
  const [uploading, setUploading] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<Date | null>(null);
  const [sharing, setSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenWindowRef = useRef<Window | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !matchId) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("user1_id, user2_id").eq("id", matchId).single();
      if (!m) return;
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", otherId).single();
      setOther(p ? { id: otherId, ...p } : null);
      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at");
      setMessages((msgs ?? []) as Message[]);
    })();

    // Postgres realtime: new + deleted messages
    const ch = supabase.channel(`messages:${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((m) => [...m, payload.new as Message]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => setMessages((m) => m.filter((x) => x.id !== (payload.old as Message).id)))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, matchId]);

  // Presence channel — track who's currently in this chat
  useEffect(() => {
    if (!user || !matchId || !other) return;
    const presence = supabase.channel(`presence:match:${matchId}`, {
      config: { presence: { key: user.id } },
    });

    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState<{ user_id: string; online_at: string }>();
        const entries = Object.entries(state).filter(([k]) => k !== user.id);
        const isOn = entries.length > 0;
        setOtherOnline(isOn);
        if (!isOn) {
          // Use most recent leave we tracked
          const lastEntry = entries[0]?.[1]?.[0];
          if (lastEntry?.online_at) setOtherLastSeen(new Date(lastEntry.online_at));
        } else {
          setOtherLastSeen(null);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        if (key === other.id && leftPresences[0]) {
          setOtherOnline(false);
          setOtherLastSeen(new Date((leftPresences[0] as any).online_at ?? Date.now()));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(presence); };
  }, [user, matchId, other]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !matchId) return;
    const content = text.trim().slice(0, 2000);
    setText("");
    await supabase.from("messages").insert({
      match_id: matchId, sender_id: user.id, content,
      is_code: codeMode, language: codeMode ? language : null,
    });
    setCodeMode(false);
  };

  const onPickFile = () => fileInputRef.current?.click();
  const onPickCamera = () => cameraInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !matchId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${matchId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-uploads").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const url = supabase.storage.from("chat-uploads").getPublicUrl(path).data.publicUrl;
      const isImage = file.type.startsWith("image/");
      await supabase.from("messages").insert({
        match_id: matchId, sender_id: user.id,
        content: file.name,
        is_code: false, language: null,
        attachment_url: url,
        attachment_type: isImage ? "image" : "file",
      });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setSharing(true);

      // Open a preview window for the sharer
      const w = window.open("", "_blank", "width=900,height=600");
      if (w) {
        screenWindowRef.current = w;
        w.document.title = "Screen share preview — Devdate";
        w.document.body.style.cssText = "margin:0;background:#0a0a14;display:flex;align-items:center;justify-content:center;min-height:100vh;color:white;font-family:sans-serif;";
        const video = w.document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.style.cssText = "max-width:100%;max-height:100vh;border-radius:12px;box-shadow:0 0 60px rgba(168,85,247,0.4);";
        video.srcObject = stream;
        w.document.body.appendChild(video);
        const banner = w.document.createElement("div");
        banner.textContent = "🔴 You're sharing this to the chat preview. Close window or click 'Stop' in chat to end.";
        banner.style.cssText = "position:fixed;top:0;left:0;right:0;background:#a855f7;padding:8px;text-align:center;font-size:13px;font-weight:600;";
        w.document.body.appendChild(banner);
      }

      // Notify the chat
      if (user && matchId) {
        await supabase.from("messages").insert({
          match_id: matchId, sender_id: user.id,
          content: "🖥️ Started a screen share session",
          is_code: false, language: null,
        });
      }

      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: "Screen share failed", description: err.message, variant: "destructive" });
      }
    }
  };

  const stopScreenShare = async () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    screenWindowRef.current?.close();
    screenWindowRef.current = null;
    setSharing(false);
    if (user && matchId) {
      await supabase.from("messages").insert({
        match_id: matchId, sender_id: user.id,
        content: "🛑 Ended screen share",
        is_code: false, language: null,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-strong sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b border-glass-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {other && (
          <button onClick={() => navigate(`/u/${other.id}`)} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity text-left">
            <div className="relative">
              {other.avatar_url ? (
                <img src={other.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm">{other.display_name[0]}</div>
              )}
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                otherOnline ? "bg-like animate-pulse" : "bg-muted-foreground"
              )} />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold leading-tight">{other.display_name}</p>
              <p className="text-[11px] text-muted-foreground">
                {otherOnline ? (
                  <span className="text-like font-medium">● Online now</span>
                ) : otherLastSeen ? (
                  <>Last seen {formatDistanceToNow(otherLastSeen, { addSuffix: true })}</>
                ) : (
                  <>Offline</>
                )}
              </p>
            </div>
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={sharing ? stopScreenShare : startScreenShare}
          className={cn("rounded-full", sharing && "bg-pass/20 text-pass animate-pulse")}
          title={sharing ? "Stop sharing" : "Share your screen"}
        >
          {sharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m, idx) => {
            const mine = m.sender_id === user?.id;
            const prev = messages[idx - 1];
            const showDateBreak = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
            return (
              <div key={m.id}>
                {showDateBreak && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground glass px-3 py-1 rounded-full">
                      {format(new Date(m.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn("flex group", mine ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[80%] flex flex-col", mine ? "items-end" : "items-start")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm relative",
                      mine
                        ? "bg-gradient-primary text-primary-foreground rounded-br-md shadow-glow"
                        : "glass rounded-bl-md"
                    )}>
                      {m.attachment_url && m.attachment_type === "image" ? (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer">
                          <img src={m.attachment_url} alt={m.content} className="max-w-[260px] max-h-[260px] rounded-lg object-cover" />
                        </a>
                      ) : m.attachment_url ? (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer"
                           className="flex items-center gap-2 underline-offset-2 hover:underline">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="break-all">{m.content}</span>
                        </a>
                      ) : m.is_code ? (
                        <pre className="font-mono text-xs whitespace-pre-wrap overflow-x-auto bg-background/40 rounded-lg p-3 -mx-1">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{m.language}</div>
                          {m.content}
                        </pre>
                      ) : <p className="break-words whitespace-pre-wrap">{m.content}</p>}
                    </div>
                    <div className={cn("flex items-center gap-1.5 mt-1 px-1", mine ? "flex-row-reverse" : "flex-row")}>
                      <span className="text-[10px] text-muted-foreground" title={format(new Date(m.created_at), "PPpp")}>
                        {format(new Date(m.created_at), "h:mm a")}
                      </span>
                      {mine && (
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm pt-12">
            <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Break the ice — try a code snippet 👇</p>
          </div>
        )}
      </div>

      <div className="glass-strong border-t border-glass-border p-3 sticky bottom-0">
        {codeMode && (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-muted-foreground">Snippet in</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="bg-input/50 border border-border rounded-md px-2 py-1 font-mono">
              {["typescript","javascript","python","rust","go","sql","html","css"].map((l) => <option key={l}>{l}</option>)}
            </select>
            <Button size="sm" variant="ghost" onClick={() => setCodeMode(false)} className="ml-auto h-6 px-2"><X className="w-3 h-3" /></Button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.zip,.txt,.md,.json,.js,.ts,.tsx,.py,.go,.rs" className="hidden" onChange={handleFile} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onPickFile} disabled={uploading}
            className="rounded-full shrink-0" title="Attach file">
            {uploading ? <ImageIcon className="w-4 h-4 animate-pulse" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onPickCamera} disabled={uploading}
            className="rounded-full shrink-0" title="Take photo">
            <Camera className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCodeMode((c) => !c)}
            className={cn("rounded-full shrink-0", codeMode && "bg-primary/20 text-primary")} title="Send code">
            <Code2 className="w-4 h-4" />
          </Button>
          {codeMode ? (
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder="// paste your snippet"
              className="flex-1 bg-input/50 border border-border rounded-2xl px-4 py-2 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          ) : (
            <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Message..." className="bg-input/50 border-border rounded-full" />
          )}
          <Button onClick={send} size="icon" className="rounded-full bg-gradient-primary border-0 shadow-glow shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
