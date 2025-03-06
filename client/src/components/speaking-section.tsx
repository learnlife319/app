import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpeakingSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Volume2, ThumbsUp, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CommentSection } from "./comment-section";
import { cn } from "@/lib/utils";

// Helper function to calculate total reactions
const getTotalReactions = (reactions: Record<string, number> = {}) => {
  return (reactions.helpful || 0) + (reactions.important || 0);
};

export function SpeakingSection() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [reactionCooldowns, setReactionCooldowns] = useState<Record<string, boolean>>({});
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const { data: speakings = [], isLoading } = useQuery({
    queryKey: ["/api/speaking"],
    queryFn: async () => {
      const res = await fetch("/api/speaking");
      if (!res.ok) throw new Error("Failed to fetch speaking attempts");
      return res.json();
    },
    select: (data) => {
      // Sort the speaking items by total reactions
      return [...data].sort((a, b) => getTotalReactions(b.reactions) - getTotalReactions(a.reactions));
    },
  });

  // Enhanced reaction mutation with error handling
  const reactionMutation = useMutation({
    mutationFn: async ({ speakingId, reactions }: { speakingId: number; reactions: Record<string, number> }) => {
      const response = await apiRequest("POST", `/api/speaking/${speakingId}/reactions`, reactions);
      if (!response.ok) {
        throw new Error('Failed to update reactions');
      }
      const result = await response.json().catch(() => ({}));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/speaking"] });
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

  const handleReaction = (speakingId: number, reactionType: string, currentReactions: Record<string, number>) => {
    const cooldownKey = `${speakingId}-${reactionType}`;
    if (reactionCooldowns[cooldownKey]) {
      toast({
        title: "Please wait",
        description: "You're clicking too fast! Wait a moment before reacting again.",
      });
      return;
    }

    const currentValue = currentReactions?.[reactionType] || 0;
    const newValue = currentValue > 0 ? 0 : 1;

    const newReactions = {
      ...currentReactions,
      [reactionType]: newValue
    };

    setReactionCooldowns(prev => ({ ...prev, [cooldownKey]: true }));
    reactionMutation.mutate({ speakingId, reactions: newReactions });

    setTimeout(() => {
      setReactionCooldowns(prev => ({ ...prev, [cooldownKey]: false }));
    }, 2000);
  };

  const speakingForm = useForm({
    resolver: zodResolver(insertSpeakingSchema),
    defaultValues: {
      title: "",
      audioUrl: "",
    },
  });

  const createSpeakingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/speaking", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/speaking"] });
      speakingForm.reset();
      setAudioURL(null);
      toast({
        title: "Success",
        description: "Your recording has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        speakingForm.setValue("audioUrl", url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      toast({
        title: "Recording stopped",
        description: "You can now preview your recording",
      });
    }
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
        <h2 className="text-2xl font-bold">Speaking Practice</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recording
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Speaking Practice</DialogTitle>
            </DialogHeader>
            <Form {...speakingForm}>
              <form
                onSubmit={speakingForm.handleSubmit((data) =>
                  createSpeakingMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={speakingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "secondary"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="w-full"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>

                  {audioURL && (
                    <div className="mt-4">
                      <audio src={audioURL} controls className="w-full" />
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createSpeakingMutation.isPending || !audioURL}
                >
                  {createSpeakingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Recording
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {speakings?.map((speaking: any) => (
          <Card key={speaking.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                {speaking.title}
                <span className="text-sm text-muted-foreground ml-auto">
                  Total reactions: {getTotalReactions(speaking.reactions)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio src={speaking.audioUrl} controls className="w-full mb-6" />

              <div className="flex gap-3 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReaction(speaking.id, 'helpful', speaking.reactions)}
                  disabled={reactionCooldowns[`${speaking.id}-helpful`] || reactionMutation.isPending}
                  className={cn(
                    "transition-all duration-200 hover:scale-110",
                    speaking.reactions?.helpful && "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300",
                    reactionCooldowns[`${speaking.id}-helpful`] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {reactionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  {speaking.reactions?.helpful || 0}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReaction(speaking.id, 'important', speaking.reactions)}
                  disabled={reactionCooldowns[`${speaking.id}-important`] || reactionMutation.isPending}
                  className={cn(
                    "transition-all duration-200 hover:scale-110",
                    speaking.reactions?.important && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300",
                    reactionCooldowns[`${speaking.id}-important`] && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {reactionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  {speaking.reactions?.important || 0}
                </Button>
              </div>

              <CommentSection targetType="speaking" targetId={speaking.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}