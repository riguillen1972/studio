"use client";

import { use } from "react";
import Link from "next/link";
import { BookReader } from "@/components/textbook/book-reader";
import { useAppState } from "@/components/app-state-provider";
import { SKILLS_BY_ID, SKILL_CODES, TOPICS_BY_SECTION, sectionOf } from "@/lib/quest/skills";

/** One textbook lesson. */
export default function TextbookLessonPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill: skillId } = use(params);
  const { role } = useAppState();
  const skill = SKILLS_BY_ID[skillId];
  if (!skill) {
    return <p className="text-muted-foreground">That lesson wasn't found. <Link className="text-primary hover:underline" href="/textbook">Back to the textbook</Link></p>;
  }

  // The chapter, and the lessons before and after this one in the whole book
  const section = sectionOf(skill);
  const topics = TOPICS_BY_SECTION[section] ?? [];
  const topic = topics.find((t) => t.skillIds.includes(skillId));
  const order = topics.flatMap((t) => t.skillIds);
  const at = order.indexOf(skillId);
  const neighbor = (id: string | undefined) => (id ? { id, label: `${SKILL_CODES[id]} ${SKILLS_BY_ID[id].name}` } : null);

  return (
    <div className="mx-auto max-w-6xl">
      <BookReader
        skillId={skillId}
        skillName={skill.name}
        chapterLabel={`${section <= 5 ? "Foundations" : `Grade ${section}`} · Chapter ${topic?.letter ?? ""}: ${topic?.title ?? ""}`}
        lessonLabel={SKILL_CODES[skillId] ?? ""}
        prevLesson={neighbor(order[at - 1])}
        nextLesson={neighbor(order[at + 1])}
        canPractice={role === "k12"}
      />
    </div>
  );
}
