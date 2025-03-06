import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vocabulary } from "@shared/schema";
import { ThumbsUp, Star, Lightbulb } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sparkles } from "./sparkle";
import { CommentSection } from "./comment-section";

type VocabularyCardProps = {
  vocabulary: Vocabulary;
};

export function VocabularyCard({ vocabulary }: VocabularyCardProps) {
  const [localReactions, setLocalReactions] = useState<Record<string, boolean>>({
    helpful: vocabulary.reactions?.helpful > 0 || false,
    important: vocabulary.reactions?.important > 0 || false,
    learned: vocabulary.reactions?.learned > 0 || false
  });

  const [activeSparkles, setActiveSparkles] = useState<Record<string, boolean>>({
    helpful: false,
    important: false,
    learned: false
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      const newReactions = { ...(vocabulary.reactions || {}) };
      if (localReactions[reaction]) {
        newReactions[reaction] = Math.max(0, (newReactions[reaction] || 0) - 1);
      } else {
        newReactions[reaction] = (newReactions[reaction] || 0) + 1;
      }
      await apiRequest("POST", `/api/vocabulary/${vocabulary.id}/reactions`, newReactions);
      return newReactions;
    },
    onSuccess: (newReactions) => {
      queryClient.setQueryData(
        ["/api/vocabulary", vocabulary.folderId],
        (old: Vocabulary[] | undefined) =>
          old?.map((v) =>
            v.id === vocabulary.id ? { ...v, reactions: newReactions } : v
          )
      );
      queryClient.invalidateQueries({
        queryKey: ["/api/vocabulary", vocabulary.folderId],
      });
    },
  });

  const handleReaction = (reaction: string) => {
    setLocalReactions(prev => ({
      ...prev,
      [reaction]: !prev[reaction]
    }));

    setActiveSparkles(prev => ({
      ...prev,
      [reaction]: true
    }));
    setTimeout(() => {
      setActiveSparkles(prev => ({
        ...prev,
        [reaction]: false
      }));
    }, 300);

    reactionMutation.mutate(reaction);
  };

  const totalReactions = Object.values(vocabulary.reactions || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100/50 dark:border-emerald-900/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-200 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-teal-500 transition-colors">
                {vocabulary.word}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalReactions} reactions
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <p className="font-medium text-foreground/90">{vocabulary.definition}</p>
          {vocabulary.example && (
            <p className="text-muted-foreground italic prose dark:prose-invert">
              "{vocabulary.example}"
            </p>
          )}
          <div className="flex gap-3 pt-4 mb-4">
            <div className="relative">
              {activeSparkles.helpful && <Sparkles color="#22c55e" />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction("helpful")}
                className={cn(
                  "transition-all duration-200 hover:scale-110",
                  localReactions.helpful && "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
                )}
              >
                <ThumbsUp className={cn(
                  "h-4 w-4 mr-2 transition-colors",
                  localReactions.helpful ? "text-green-600 dark:text-green-400" : "text-gray-500"
                )} />
                {vocabulary.reactions?.helpful || 0}
              </Button>
            </div>

            <div className="relative">
              {activeSparkles.important && <Sparkles color="#eab308" />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction("important")}
                className={cn(
                  "transition-all duration-200 hover:scale-110",
                  localReactions.important && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300"
                )}
              >
                <Star className={cn(
                  "h-4 w-4 mr-2 transition-colors",
                  localReactions.important ? "text-yellow-500 dark:text-yellow-400" : "text-gray-500",
                  "fill-current"
                )} />
                {vocabulary.reactions?.important || 0}
              </Button>
            </div>

            <div className="relative">
              {activeSparkles.learned && <Sparkles color="#3b82f6" />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction("learned")}
                className={cn(
                  "transition-all duration-200 hover:scale-110",
                  localReactions.learned && "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                )}
              >
                <Lightbulb className={cn(
                  "h-4 w-4 mr-2 transition-colors",
                  localReactions.learned ? "text-blue-600 dark:text-blue-400" : "text-gray-500"
                )} />
                {vocabulary.reactions?.learned || 0}
              </Button>
            </div>
          </div>

          {/* Add Comment Section */}
          <CommentSection targetType="vocabulary" targetId={vocabulary.id} />
        </div>
      </CardContent>
    </Card>
  );
}