import { Code2, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export const Loader = ({ label = "Loading", fullscreen = true, className }: LoaderProps) => {
  return (
    <div className={cn(
      fullscreen ? "min-h-screen" : "py-12",
      "flex flex-col items-center justify-center gap-4 relative overflow-hidden",
      className
    )}>
      {fullscreen && (
        <>
          <div className="aurora-orb w-[400px] h-[400px] -top-32 -left-32 bg-primary/40" />
          <div className="aurora-orb w-[400px] h-[400px] -bottom-32 -right-32 bg-accent/30" />
        </>
      )}

      {/* Animated Devdate mark */}
      <div className="relative w-20 h-20">
        {/* Orbit ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: "4s" }} />

        {/* Pulsing glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-primary opacity-40 blur-xl animate-pulse-glow" />

        {/* Code icon (gently tilting) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Code2 className="w-9 h-9 text-primary animate-logo-tilt" strokeWidth={2.5} />
        </div>

        {/* Heart beating in corner */}
        <div className="absolute -bottom-1 -right-1">
          <Heart className="w-5 h-5 text-accent fill-accent animate-heartbeat" />
        </div>

        {/* Orbiting spark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2">
          <Sparkles className="w-3 h-3 text-secondary animate-spark" />
        </div>
      </div>

      {label && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-sm font-display font-semibold text-gradient">{label}</span>
          <span className="flex gap-0.5 ml-1">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      )}
    </div>
  );
};

export default Loader;
