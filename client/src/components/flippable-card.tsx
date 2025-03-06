import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

type FlippableCardProps = {
  front: {
    icon: ReactNode;
    title: string;
    description: string;
    image: string;
  };
  back: {
    title: string;
    details: string[];
    cta: string;
  };
};

export function FlippableCard({ front, back }: FlippableCardProps) {
  return (
    <div className="perspective-1000 relative h-full w-full">
      <div className="relative transition-transform duration-700 transform-style-preserve-3d hover:rotate-y-180 w-full h-full">
        {/* Front */}
        <Card className="absolute w-full h-full backface-hidden group overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-4 relative z-10">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {front.icon}
            </div>
            <CardTitle>{front.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {front.description}
            </p>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500" 
                style={{backgroundImage: `url("${front.image}")`}}
              />
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>{back.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {back.details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="h-2 w-2 mt-2 rounded-full bg-primary-foreground/80 mr-3" />
                  <span className="flex-1">{detail}</span>
                </li>
              ))}
            </ul>
            <p className="text-lg font-semibold text-center">
              {back.cta}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
