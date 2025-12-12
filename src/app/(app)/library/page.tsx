import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import data from '@/lib/placeholder-images.json';

type LibraryItem = {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
    title: string;
    type: string;
}

const libraryItems: LibraryItem[] = data.placeholderImages;

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Content Library
        </h1>
        <p className="text-muted-foreground mt-1">
          A curated collection of articles, videos, and simulations to supplement your learning.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {libraryItems.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            <div className="relative h-48 w-full">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                data-ai-hint={item.imageHint}
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline">{item.title}</CardTitle>
                <Badge variant={item.type === 'Video' ? 'default' : 'secondary'}>{item.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
