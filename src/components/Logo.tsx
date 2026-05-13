import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Text size for the wordmark */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show the small icon mark to the left */
  withMark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { text: "text-lg", mark: "w-7 h-7", heart: "w-3 h-3", code: "text-base" },
  md: { text: "text-xl", mark: "w-9 h-9", heart: "w-3.5 h-3.5", code: "text-lg" },
  lg: { text: "text-3xl", mark: "w-11 h-11", heart: "w-4 h-4", code: "text-2xl" },
  xl: { text: "text-5xl md:text-6xl", mark: "w-16 h-16", heart: "w-6 h-6", code: "text-4xl md:text-5xl" },
};

/**
 * Devdate{<♡/>} animated wordmark.
 * - "Dev" wordmark with the existing 3D flip animation
 * - "date" in gradient text
 * - {<♡/>} styled like a self-closing JSX tag with a beating heart
 */
export const Logo = ({ size = "md", withMark = true, className }: LogoProps) => {
  const s = sizeMap[size];
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      {withMark && (
        <div className={cn("relative flex items-center justify-center", s.mark)}>
          <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-md animate-pulse-glow" />
          <div className="absolute inset-0 rounded-full border border-dashed border-primary/40 animate-spin" style={{ animationDuration: "6s" }} />
          <Heart className={cn("relative text-accent fill-accent animate-heartbeat", s.heart)} />
        </div>
      )}
      <h1 className={cn("font-display font-bold tracking-tight leading-none flex items-baseline", s.text)}>
        <span className="text-gradient animate-dev-flip">Dev</span>
        <span className="text-gradient">date</span>
        <span className={cn("font-mono ml-1 flex items-baseline", s.code)}>
          <span className="text-secondary">{"{"}</span>
          <span className="text-primary">{"<"}</span>
          <Heart className={cn("inline-block text-accent fill-accent animate-heartbeat mx-[1px]", s.heart)} />
          <span className="text-primary">{"/>"}</span>
          <span className="text-secondary">{"}"}</span>
        </span>
      </h1>
    </div>
  );
};

export default Logo;
