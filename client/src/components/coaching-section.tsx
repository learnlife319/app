import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Video } from "lucide-react";

export function CoachingSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">TOEFL Coaching</h2>
        <Button>Schedule Session</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Coaches</CardTitle>
            <CardDescription>Connect with experienced TOEFL instructors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 border-b pb-4">
                <img
                  src="/attached_assets/56031.jpg"
                  alt="Coach Sarah Johnson"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">10+ years TOEFL experience</p>
                  <div className="flex gap-2 mt-2">
                    <a 
                      href="https://t.me/TOEFLReadin/727" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Book
                      </Button>
                    </a>
                    <a 
                      href="https://t.me/jinabnn" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <img
                  src="/attached_assets/56033.jpg"
                  alt="Coach Michael Chen"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium">Michael Chen</h4>
                  <p className="text-sm text-muted-foreground">TOEFL Score: 119/120</p>
                  <div className="flex gap-2 mt-2">
                    <a 
                      href="https://t.me/TOEFLReadin/727" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Book
                      </Button>
                    </a>
                    <a 
                      href="https://t.me/jinabnn" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled coaching sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Speaking Practice</h4>
                    <p className="text-sm text-muted-foreground">Tomorrow at 2:00 PM</p>
                    <p className="text-sm text-muted-foreground">with Sarah Johnson</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Video className="w-4 h-4 mr-1" />
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}