import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Passage } from "@shared/schema";
import { ThumbsUp, ThumbsDown, Star, BookOpen, Share, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CommentSection } from "./comment-section";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type PassageCardProps = {
  passage: Passage;
};

export function PassageCard({ passage }: PassageCardProps) {
  const { user } = useAuth();
  const [localReactions, setLocalReactions] = useState<Record<string, boolean>>({
    thumbsUp: false,
    thumbsDown: false,
    star: false
  });
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const { toast } = useToast();

  const reactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      const newReactions = { ...passage.reactions };
      if (localReactions[reaction]) {
        newReactions[reaction] = Math.max(0, (newReactions[reaction] || 0) - 1);
      } else {
        newReactions[reaction] = (newReactions[reaction] || 0) + 1;
      }
      await apiRequest("POST", `/api/passages/${passage.id}/reactions`, newReactions);
      return newReactions;
    },
    onSuccess: (newReactions) => {
      queryClient.setQueryData(
        ["/api/passages", passage.folderId],
        (old: Passage[] | undefined) =>
          old?.map((p) =>
            p.id === passage.id ? { ...p, reactions: newReactions } : p
          )
      );
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/passages/${passage.id}/share`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to share");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Passage shared to Telegram channel",
      });
    },
    onError: (error: Error) => {
      if (error.message === "No Telegram channel ID configured") {
        setShowChannelDialog(true);
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await apiRequest("POST", "/api/users/telegram-channel", { channelId });
      if (!res.ok) throw new Error("Failed to update channel ID");
    },
    onSuccess: () => {
      setShowChannelDialog(false);
      shareMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update channel ID",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (reaction: string) => {
    setLocalReactions(prev => ({
      ...prev,
      [reaction]: !prev[reaction]
    }));
    reactionMutation.mutate(reaction);
  };

  const commentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const res = await apiRequest("POST", "/api/comments", commentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments", "passage", passage.id] });
    },
  });

  const handleWordClick = async (word: string) => {
    const isHighlighted = highlightedWords.includes(word);

    if (isHighlighted) {
      setHighlightedWords(prev => prev.filter(w => w !== word));
    } else {
      setHighlightedWords(prev => [...prev, word]);
      setIsLoadingWord(true);

      try {
        const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const dictData = await dictResponse.json();

        const translationResponse = await fetch(
          `https://mymemory.translated.net/api/get?q=${word}&langpair=en|fa`
        );
        const translationData = await translationResponse.json();

        const definitions = dictData[0]?.meanings?.[0]?.definitions?.slice(0, 3) || [];
        const synonyms = dictData[0]?.meanings?.[0]?.synonyms?.slice(0, 5) || [];
        const translation = translationData?.responseData?.translatedText || 'Translation not available';

        const dictionaryEntry = `📚 Word Analysis: "${word.toUpperCase()}"

📖 Definitions:
${definitions.map((def: any, index: number) => `${index + 1}. ${def.definition}`).join('\n')}

✨ Example Sentences:
${definitions.map((def: any, index: number) => def.example ? `• ${def.example}` : '').filter(Boolean).join('\n')}

🔄 Synonyms:
${synonyms.length > 0 ? synonyms.join(', ') : 'No synonyms available'}

🌐 Persian Translation:
• ${translation}`;

        commentMutation.mutate({
          content: dictionaryEntry,
          targetType: "passage",
          targetId: passage.id,
        });
      } catch (error) {
        console.error('Error fetching word data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch word information",
          variant: "destructive",
        });
      } finally {
        setIsLoadingWord(false);
      }
    }
  };

  const totalReactions = Object.values(passage.reactions || {}).reduce(
    (sum, count) => sum + count,
    0
  );

  const renderHighlightedContent = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.trim() === '') return word;
      const isHighlighted = highlightedWords.includes(word.trim());
      return (
        <span
          key={index}
          onClick={() => handleWordClick(word.trim())}
          className={cn(
            "cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200",
            isHighlighted && "bg-green-200 dark:bg-green-800/50"
          )}
        >
          {word}
          {isLoadingWord && highlightedWords[highlightedWords.length - 1] === word.trim() && (
            <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />
          )}
        </span>
      );
    });
  };

  return (
    <Card className="bg-background border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-foreground">
              {passage.title}
            </CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalReactions} reactions
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none mb-4">
          <p className="text-foreground whitespace-pre-wrap">
            {renderHighlightedContent(passage.content)}
          </p>
        </div>
        <div className="flex gap-2 pt-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction("thumbsUp")}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              localReactions.thumbsUp && "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
            )}
          >
            <ThumbsUp className={cn(
              "h-4 w-4 mr-1 transition-colors",
              localReactions.thumbsUp ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              localReactions.thumbsUp && "text-green-700 dark:text-green-300"
            )}>
              {passage.reactions?.thumbsUp || 0}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction("thumbsDown")}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              localReactions.thumbsDown && "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300"
            )}
          >
            <ThumbsDown className={cn(
              "h-4 w-4 mr-1 transition-colors",
              localReactions.thumbsDown ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )} />
            <span className={cn(
              localReactions.thumbsDown && "text-red-700 dark:text-red-300"
            )}>
              {passage.reactions?.thumbsDown || 0}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction("star")}
            className={cn(
              "transition-all duration-200 hover:scale-105",
              localReactions.star && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300"
            )}
          >
            <Star className={cn(
              "h-4 w-4 mr-1 transition-colors",
              localReactions.star ? "text-yellow-500 dark:text-yellow-400" : "text-muted-foreground",
              "fill-current"
            )} />
            <span className={cn(
              localReactions.star && "text-yellow-700 dark:text-yellow-300"
            )}>
              {passage.reactions?.star || 0}
            </span>
          </Button>

          <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareMutation.mutate()}
                className="transition-all duration-200 hover:scale-105"
              >
                <Share className="h-4 w-4 mr-1 text-muted-foreground" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Telegram Channel ID</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your Telegram channel ID to share passages. Make sure to add our bot to your channel first.
                </p>
                <Input
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="e.g. @mychannel or -100123456789"
                />
                <Button
                  className="w-full"
                  onClick={() => updateChannelMutation.mutate(channelId)}
                  disabled={updateChannelMutation.isPending}
                >
                  Save & Share
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <CommentSection targetType="passage" targetId={passage.id} />
      </CardContent>
    </Card>
  );
}