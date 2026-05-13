import { NavLink, useLocation } from "react-router-dom";
import { Flame, MessageCircle, User, Sparkles, BarChart3, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const tabs = [
  { to: "/discover", label: "Discover", icon: Flame },
  { to: "/liked", label: "Liked", icon: Heart },
  { to: "/matches", label: "Matches", icon: Sparkles },
  { to: "/messages", label: "Chats", icon: MessageCircle },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-2 py-2 flex gap-1 shadow-glow">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors text-sm font-medium",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="nav-bg"
                className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
