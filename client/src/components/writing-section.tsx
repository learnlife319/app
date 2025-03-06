import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWritingSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Book, ThumbsUp, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CommentSection } from "./comment-section";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function WritingSection() {
  const [charCount, setCharCount] = useState(0);
  const [reactionCooldowns, setReactionCooldowns] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: writingsData = [], isLoading } = useQuery({
    queryKey: ["/api/writings"],
    queryFn: async () => {
      const res = await fetch("/api/writings");
      if (!res.ok) throw new Error("Failed to fetch writings");
      return res.json();
    },
  });

  // Sort writings by total reaction count (sum of all reaction types)
  const writings = [...writingsData].sort((a, b) => {
    const getTotalReactions = (item: any) => {
      if (!item.reactions) return 0;
      return Object.values(item.reactions).reduce((sum: number, count: any) => sum + (count || 0), 0);
    };

    return getTotalReactions(b) - getTotalReactions(a);
  });

  const writingForm = useForm({
    resolver: zodResolver(insertWritingSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const createWritingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/writings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
      writingForm.reset();
      setCharCount(0);
    },
  });

  // Add reaction mutation with cooldown
  const reactionMutation = useMutation({
    mutationFn: async ({ writingId, reactions }: { writingId: number; reactions: Record<string, number> }) => {
      const response = await apiRequest("POST", `/api/writings/${writingId}/reactions`, reactions);
      if (!response.ok) {
        throw new Error('Failed to update reactions');
      }
      const result = await response.json().catch(() => ({}));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writings"] });
    },
    onError: (error) => {
      console.error("Reaction error:", error);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (writingId: number, reactionType: string, currentReactions: Record<string, number>) => {
    const cooldownKey = `${writingId}-${reactionType}`;
    if (reactionCooldowns[cooldownKey]) {
      toast({
        title: "Please wait",
        description: "You're clicking too fast! Wait a moment before reacting again.",
      });
      return;
    }

    // Toggle the reaction - if it exists and is greater than 0, decrement by 1, otherwise set to 1
    const currentValue = currentReactions?.[reactionType] || 0;
    const newValue = currentValue > 0 ? 0 : 1;

    const newReactions = {
      ...currentReactions,
      [reactionType]: newValue
    };

    setReactionCooldowns(prev => ({ ...prev, [cooldownKey]: true }));
    reactionMutation.mutate({ writingId, reactions: newReactions });

    // Reset cooldown after 2 seconds
    setTimeout(() => {
      setReactionCooldowns(prev => ({ ...prev, [cooldownKey]: false }));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Writing Practice
          </h2>
          <p className="text-muted-foreground mt-1">
            Practice your TOEFL writing skills and get feedback
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              New Writing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Add New Writing
              </DialogTitle>
            </DialogHeader>
            <Form {...writingForm}>
              <form
                onSubmit={writingForm.handleSubmit((data) =>
                  createWritingMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={writingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} className="transition-all duration-200 focus:scale-[1.01]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={writingForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[200px] transition-all duration-200 focus:scale-[1.01]"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setCharCount(e.target.value.length);
                          }}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <FormMessage />
                        <span>{charCount} characters</span>
                      </div>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  disabled={createWritingMutation.isPending}
                >
                  {createWritingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Writing
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {writings.map((writing: any) => (
          <Card key={writing.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Book className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-blue-700 dark:text-blue-300 group-hover:text-blue-600 transition-colors">
                  {writing.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="whitespace-pre-wrap mb-6 prose dark:prose-invert">{writing.content}</p>
              </div>

              {/* Enhanced Reaction Buttons */}
              <div className="flex gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReaction(writing.id, 'helpful', writing.reactions)}
                  disabled={reactionCooldowns[`${writing.id}-helpful`] || reactionMutation.isPending}
                  className={cn(
                    "transition-all duration-200 hover:scale-110",
                    writing.reactions?.helpful && "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300",
                    reactionCooldowns[`${writing.id}-helpful`] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {reactionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  {writing.reactions?.helpful || 0}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReaction(writing.id, 'important', writing.reactions)}
                  disabled={reactionCooldowns[`${writing.id}-important`] || reactionMutation.isPending}
                  className={cn(
                    "transition-all duration-200 hover:scale-110",
                    writing.reactions?.important && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300",
                    reactionCooldowns[`${writing.id}-important`] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {reactionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  {writing.reactions?.important || 0}
                </Button>
              </div>

              {/* Comment Section */}
              <CommentSection targetType="writing" targetId={writing.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}