"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionBank } from "./question-bank";

/** Teacher side of Math Quest (grades 6–8 adaptive math). More sections are added in later stages. */
export function QuestTeacher() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Math Quest</h2>
        <p className="text-sm text-muted-foreground">
          Adaptive math for grades 6–8: fractions, ratios and proportions, and equations. A short diagnostic finds each
          student&apos;s weak spots, then daily practice fixes them.
        </p>
      </div>
      <Tabs defaultValue="bank">
        <TabsList>
          <TabsTrigger value="bank">Question bank</TabsTrigger>
        </TabsList>
        <TabsContent value="bank" className="mt-4">
          <QuestionBank />
        </TabsContent>
      </Tabs>
    </div>
  );
}
