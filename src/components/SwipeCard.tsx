import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Github, MapPin, Sparkles, X, Heart, Star } from "lucide-react";
import { INTENT_LABELS } from "@/lib/constants";

export interface ProfileCardData {
  id: string;
  display_name: string;
  bio: string;
  intent: string;
  tech_stack: string[];
  interests: string[];
  github_handle: string | null;
  location: string | null;
  years_experience: number | null;
  avatar_url: string | null;
  compat: number;
}

interface Props {
  profile: ProfileCardData;
  onSwipe: (dir: "left" | "right") => void;
  isTop: boolean;
  index: number;
}

export const SwipeCard = ({ profile, onSwipe, isTop, index }: Props) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120) onSwipe("right");
    else if (info.offset.x < -120) onSwipe("left");
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 1 - index * 0.05, y: index * 12, opacity: 1 }}
      animate={{ scale: 1 - index * 0.05, y: index * 12, opacity: index < 3 ? 1 : 0 }}
      exit={{ x: x.get() > 0 ? 400 : -400, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="relative w-full h-full glass-strong rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Avatar/header */}
        <div className="relative h-3/5 bg-gradient-primary">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl font-display font-bold text-white/30">
                {profile.display_name[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Compat badge */}
          <div className="absolute top-4 right-4 glass-strong rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            <span className="font-display font-bold text-sm text-gradient">{profile.compat}%</span>
          </div>

          {/* Intent badge */}
          <div className="absolute top-4 left-4 glass rounded-full px-3 py-1.5 text-xs font-medium">
            {INTENT_LABELS[profile.intent]?.emoji} {INTENT_LABELS[profile.intent]?.label}
          </div>

          {/* Swipe overlays */}
          {isTop && (
            <>
              <motion.div style={{ opacity: likeOpacity }}
                className="absolute top-8 left-8 px-4 py-2 rounded-xl border-4 border-like text-like font-display font-bold text-2xl rotate-[-15deg]">
                LIKE
              </motion.div>
              <motion.div style={{ opacity: passOpacity }}
                className="absolute top-8 right-8 px-4 py-2 rounded-xl border-4 border-pass text-pass font-display font-bold text-2xl rotate-[15deg]">
                NOPE
              </motion.div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-display font-bold leading-tight">{profile.display_name}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {profile.years_experience !== null && <span>{profile.years_experience}y exp</span>}
                {profile.github_handle && <span className="flex items-center gap-1 font-mono"><Github className="w-3 h-3" />{profile.github_handle}</span>}
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</span>}
              </div>
            </div>
          </div>
          {profile.bio && <p className="text-sm text-foreground/80 line-clamp-2">{profile.bio}</p>}
          <div className="flex flex-wrap gap-1.5">
            {profile.tech_stack.slice(0, 5).map((t) => <span key={t} className="tech-pill">{t}</span>)}
            {profile.tech_stack.length > 5 && <span className="tech-pill">+{profile.tech_stack.length - 5}</span>}
          </div>
        </div>
      </div>

      {/* Action buttons (top card only) */}
      {isTop && (
        <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSwipe("left")}
            className="w-14 h-14 rounded-full glass-strong flex items-center justify-center text-pass shadow-card-elevated hover:bg-pass/20 transition-colors">
            <X className="w-6 h-6" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-superlike shadow-card-elevated">
            <Star className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSwipe("right")}
            className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-glow animate-pulse-glow">
            <Heart className="w-6 h-6 fill-current" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
