"use client";

import { use } from "react";
import Link from "next/link";
import { BookReader } from "@/components/textbook/book-reader";
import { useAppState } from "@/components/app-state-provider";
import { SKILLS_BY_ID } from "@/lib/quest/skills";
import { lessonPlace } from "@/lib/textbook";

/** One textbook lesson. */
export default function TextbookLessonPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillId } = use(params);
  const { role } = useAppState();
  const skill = SKILLS_BY_ID[skillId];
  const place = lessonPlace(skillId);
  if (!skill || !place) {
    return <p className="text-muted-foreground">That lesson wasn't found. <Link className="text-primary hover:underline" href="/textbook">Back to the textbook</Link></p>;
  }

  // "Lesson 2.3" = the 3rd lesson of chapter 2
  const label = (id: string) => {
    const p = lessonPlace(id);
    return p ? `${p.chapter.number}.${p.lessonInChapter} ${SKILLS_BY_ID[id].name}` : SKILLS_BY_ID[id]?.name ?? "";
  };
  const neighbor = (id: string | undefined) => (id ? { id, label: label(id) } : null);
  const { grade, unit, chapter, lessonInChapter } = place;

  return (
    <div className="mx-auto max-w-6xl">
      <BookReader
        skillId={skillId}
        skillName={skill.name}
        chapterLabel={`Grade ${grade} · Unit ${unit.letter}: ${unit.title} · Chapter ${chapter.number}`}
        lessonLabel={`Lesson ${chapter.number}.${lessonInChapter}`}
        prevLesson={neighbor(place.prevId)}
        nextLesson={neighbor(place.nextId)}
        canPractice={role === "k12"}
      />
    </div>
  );
}
