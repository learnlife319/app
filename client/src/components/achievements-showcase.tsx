import { useQuery } from "@tanstack/react-query";
import { AchievementBadge, BadgeType } from "./achievement-badge";
import { Achievement } from "@shared/schema";

const AVAILABLE_ACHIEVEMENTS = [
  {
    type: "completion" as BadgeType,
    label: "First Steps",
    requirement: "Complete your first practice session",
  },
  {
    type: "streak" as BadgeType,
    label: "Consistent Learner",
    requirement: "Complete 5 sessions in a row",
  },
  {
    type: "mastery" as BadgeType,
    label: "Reading Master",
    requirement: "Score 90% or higher in reading",
  },
  {
    type: "excellence" as BadgeType,
    label: "Vocabulary Expert",
    requirement: "Learn 100 words",
  },
  {
    type: "champion" as BadgeType,
    label: "Speaking Champion",
    requirement: "Complete 10 speaking practices",
  },
  {
    type: "legend" as BadgeType,
    label: "TOEFL Legend",
    requirement: "Achieve all other badges",
  },
];

export function AchievementsShowcase() {
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Your Achievements
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {AVAILABLE_ACHIEVEMENTS.map((badge) => {
          const earned = achievements?.some((a) => a.type === badge.type);
          return (
            <div
              key={badge.type}
              className="group relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="mb-2">
                <AchievementBadge
                  type={badge.type}
                  label={badge.label}
                  earned={earned}
                  showAnimation={false}
                />
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {badge.requirement}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
