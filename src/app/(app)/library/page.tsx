
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

type LibraryItem = {
  id: string;
  description: string;
  image_url: string;
  image_hint: string;
  title: string;
  type: string;
};

export default function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('learning_content')
        .select('*');
      
      if (error) {
        setError(error.message);
      } else {
        setLibraryItems(data || []);
      }
      setIsLoading(false);
    };
    fetchItems();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            Content Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Loading curated articles, videos, and simulations...
          </p>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden flex flex-col">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          Content Library
        </h1>
        <p className="text-muted-foreground mt-1">
          A curated collection of articles, videos, and simulations to
          supplement your learning.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {libraryItems.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            <div className="relative h-48 w-full">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                data-ai-hint={item.image_hint}
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline">{item.title}</CardTitle>
                <Badge variant={item.type === "Video" ? "default" : "secondary"}>
                  {item.type}
                </Badge>
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
