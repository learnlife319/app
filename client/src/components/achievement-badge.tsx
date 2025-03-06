import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Star,
  Award,
  Trophy,
  Crown,
  CheckCircle2,
  Medal,
} from "lucide-react";

export type BadgeType = "completion" | "streak" | "mastery" | "excellence" | "champion" | "legend";

interface AchievementBadgeProps {
  type: BadgeType;
  label: string;
  earned?: boolean;
  showAnimation?: boolean;
}

const badgeConfig = {
  completion: {
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-500",
    shadowColor: "shadow-green-500/20",
  },
  streak: {
    icon: Medal,
    color: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/20",
  },
  mastery: {
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    shadowColor: "shadow-yellow-500/20",
  },
  excellence: {
    icon: Award,
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/20",
  },
  champion: {
    icon: Trophy,
    color: "from-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/20",
  },
  legend: {
    icon: Crown,
    color: "from-indigo-500 to-violet-500",
    shadowColor: "shadow-indigo-500/20",
  },
};

export function AchievementBadge({
  type,
  label,
  earned = false,
  showAnimation = false,
}: AchievementBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <div className="relative inline-flex group">
      <motion.div
        initial={showAnimation ? { scale: 0.5, opacity: 0 } : false}
        animate={
          showAnimation
            ? {
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1],
              }
            : false
        }
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <Badge
          className={cn(
            "px-3 py-1 gap-2 text-sm font-medium transition-all duration-300",
            earned
              ? cn(
                  "bg-gradient-to-r",
                  config.color,
                  config.shadowColor,
                  "shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                  "text-white"
                )
              : "bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
        >
          <Icon className={cn("h-4 w-4", earned && "animate-pulse")} />
          {label}
        </Badge>
      </motion.div>
      {earned && showAnimation && (
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r rounded-full blur-xl",
            config.color,
            "opacity-0"
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  );
}
