import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Timer } from "lucide-react";

export function DailyReadingSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Daily Reading</h2>
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">20 minutes remaining</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Passage: The Evolution of Urban Planning</CardTitle>
          <CardDescription>Reading time: ~15 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert">
            <p>
              Urban planning has undergone significant changes throughout history. 
              The ancient Romans were among the first to implement systematic city planning, 
              with their grid-based street layouts and sophisticated water management systems. 
              These early innovations laid the groundwork for modern urban development practices.
            </p>
            <p>
              During the Industrial Revolution, cities faced new challenges as populations 
              grew rapidly. The need for efficient transportation and sanitation became paramount, 
              leading to the development of comprehensive planning approaches that considered both 
              infrastructure and social needs.
            </p>
            {/* Add more paragraphs as needed */}
          </div>
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Comprehension Questions:</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground">1. What was the main contribution of Roman city planning to urban development?</p>
                <div className="flex gap-2">
                  <Button variant="outline">Grid system</Button>
                  <Button variant="outline">Water management</Button>
                  <Button variant="outline">Both of these</Button>
                </div>
              </div>
              {/* Add more questions */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          Previous Readings
        </Button>
        <Button>Submit Answers</Button>
      </div>
    </div>
  );
}
