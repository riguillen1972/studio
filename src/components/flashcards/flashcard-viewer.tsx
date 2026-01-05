'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { RotateCw } from 'lucide-react';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  topic: string;
  onStartNew: () => void;
}

export default function FlashcardViewer({
  flashcards,
  topic,
  onStartNew,
}: FlashcardViewerProps) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const handleFlip = (index: number) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline">Flashcards on {topic}</CardTitle>
            <CardDescription>
              Click on a card to flip it. Use the arrows to navigate.
            </CardDescription>
          </div>
          <Button onClick={onStartNew} variant="outline" size="sm">
            Start New Set
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Carousel className="w-full max-w-lg mx-auto">
          <CarouselContent>
            {flashcards.map((card, index) => (
              <CarouselItem key={index}>
                <div
                  className="w-full h-80 perspective-1000"
                  onClick={() => handleFlip(index)}
                >
                  <div
                    className={cn(
                      'relative w-full h-full text-center transition-transform duration-700 transform-style-preserve-3d cursor-pointer',
                      { 'rotate-y-180': flipped[index] }
                    )}
                  >
                    {/* Front of the card */}
                    <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-secondary rounded-lg border">
                      <p className="text-xl font-semibold">{card.front}</p>
                    </div>
                    {/* Back of the card */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 bg-primary text-primary-foreground rounded-lg border">
                      <p className="text-lg">{card.back}</p>
                    </div>
                  </div>
                </div>
                 <div className="text-center mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4"/>
                    Click card to flip
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
}

// Add some styles to globals.css to make the 3D flip effect work
// @layer utilities {
//   .perspective-1000 { perspective: 1000px; }
//   .transform-style-preserve-3d { transform-style: preserve-3d; }
//   .rotate-y-180 { transform: rotateY(180deg); }
//   .backface-hidden { backface-visibility: hidden; }
// }
// I will add these to globals.css
