interface ProfileLike {
  tech_stack: string[];
  interests: string[];
  intent: string;
  timezone?: string | null;
}

export const computeCompatibility = (a: ProfileLike, b: ProfileLike): number => {
  if (!a || !b) return 0;
  const techOverlap = a.tech_stack.filter((t) => b.tech_stack.includes(t)).length;
  const techScore = Math.min(techOverlap / Math.max(3, Math.min(a.tech_stack.length, b.tech_stack.length, 6)), 1) * 50;

  const interestOverlap = a.interests.filter((i) => b.interests.includes(i)).length;
  const interestScore = Math.min(interestOverlap / 3, 1) * 25;

  const intentScore = a.intent === b.intent || a.intent === "both" || b.intent === "both" ? 15 : 0;
  const tzScore = a.timezone && b.timezone && a.timezone === b.timezone ? 10 : 5;

  return Math.round(Math.min(techScore + interestScore + intentScore + tzScore, 99));
};
