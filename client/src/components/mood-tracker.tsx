import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { insertMoodSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_OPTIONS = [
  { value: "motivated", label: "Motivated", emoji: "💪" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "frustrated", label: "Frustrated", emoji: "😤" },
];

export function MoodTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const { data: moods, isLoading } = useQuery({
    queryKey: ["/api/moods"],
    queryFn: async () => {
      const res = await fetch("/api/moods?limit=5");
      if (!res.ok) throw new Error("Failed to fetch moods");
      return res.json();
    },
  });

  const createMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; note: string }) => {
      const res = await apiRequest("POST", "/api/moods", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      toast({
        title: "Mood tracked!",
        description: "Your learning mood has been recorded.",
      });
      setIsOpen(false);
      setSelectedMood(null);
      setNote("");
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) return;
    
    const parsed = insertMoodSchema.safeParse({
      mood: selectedMood,
      note: note.trim() || undefined,
    });

    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: "Please select a mood and optionally add a note.",
        variant: "destructive",
      });
      return;
    }

    createMoodMutation.mutate(parsed.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SmilePlus className="h-5 w-5" />
          Mood Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              How are you feeling about your learning today?
            </span>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Track Mood
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Track Your Learning Mood</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className={cn(
                          "h-20 flex flex-col gap-1",
                          selectedMood === option.value && "border-primary"
                        )}
                        onClick={() => setSelectedMood(option.value)}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add a note about your mood (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedMood || createMoodMutation.isPending}
                  >
                    Save Mood
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div>Loading moods...</div>
          ) : (
            <div className="space-y-2">
              {moods?.map((mood: any) => (
                <div
                  key={mood.id}
                  className="flex items-center gap-2 text-sm p-2 bg-muted rounded-lg"
                >
                  <span className="text-xl">
                    {MOOD_OPTIONS.find((o) => o.value === mood.mood)?.emoji}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {MOOD_OPTIONS.find((o) => o.value === mood.mood)?.label}
                    </p>
                    {mood.note && (
                      <p className="text-muted-foreground">{mood.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(mood.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
