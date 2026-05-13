export const TECH_OPTIONS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "C++", "Swift", "Kotlin", "Ruby",
  "React", "Next.js", "Vue", "Svelte", "Angular", "Node.js", "Deno", "Bun",
  "PostgreSQL", "MongoDB", "Redis", "GraphQL", "Supabase", "Firebase",
  "AWS", "Vercel", "Docker", "Kubernetes", "Tailwind", "Three.js", "WebGL",
  "AI/ML", "LLMs", "PyTorch", "TensorFlow", "Solidity", "Web3",
];

export const INTEREST_OPTIONS = [
  "Open Source", "Hackathons", "Startups", "Indie Hacking", "Side Projects",
  "Mountain Biking", "Coffee", "Reading", "Music Production", "Gaming",
  "Travel", "Cooking", "Photography", "Yoga", "Anime", "Board Games",
];

export const INTENT_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  date: { label: "Dating", emoji: "💜", desc: "Looking for romance" },
  collab: { label: "Collab", emoji: "⚡", desc: "Build something together" },
  both: { label: "Both", emoji: "✨", desc: "Open to all connections" },
};
