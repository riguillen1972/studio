import test from "node:test";
import assert from "node:assert/strict";
import {
  LESSONS_PER_CHAPTER,
  lessonPlace,
  textbookUnits,
} from "../src/lib/textbook";
import { SKILLS_BY_ID } from "../src/lib/quest/skills";

const GRADES = [6, 7, 8];

test("every chapter in grades 6-8 has between 1 and LESSONS_PER_CHAPTER lessons", () => {
  for (const grade of GRADES) {
    for (const unit of textbookUnits(grade)) {
      for (const chapter of unit.chapters) {
        assert.ok(
          chapter.skillIds.length >= 1 && chapter.skillIds.length <= LESSONS_PER_CHAPTER,
          `Grade ${grade} chapter ${chapter.number} has ${chapter.skillIds.length} lessons`,
        );
      }
    }
  }
});

test("chapter numbers run 1, 2, 3, ... without gaps across each grade", () => {
  for (const grade of GRADES) {
    const numbers = textbookUnits(grade).flatMap((u) => u.chapters.map((c) => c.number));
    assert.ok(numbers.length > 0);
    numbers.forEach((num, index) => {
      assert.equal(num, index + 1);
    });
  }
});

test("within each unit, every challenge lesson comes after all regular lessons", () => {
  for (const grade of GRADES) {
    for (const unit of textbookUnits(grade)) {
      const ids = unit.chapters.flatMap((c) => c.skillIds);
      let seenChallenge = false;
      for (const id of ids) {
        const isChallenge = Boolean(SKILLS_BY_ID[id]?.advanced);
        if (isChallenge) {
          seenChallenge = true;
        } else {
          assert.equal(
            seenChallenge,
            false,
            `Grade ${grade} unit ${unit.letter} has regular lesson ${id} after a challenge lesson`,
          );
        }
      }
    }
  }
});

test("no skill id appears twice in a grade", () => {
  for (const grade of GRADES) {
    const ids = textbookUnits(grade).flatMap((u) => u.chapters.flatMap((c) => c.skillIds));
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("lessonPlace locates a known lesson and links consistently to its next lesson", () => {
  const place = lessonPlace("6.long-division");
  assert.ok(place !== null);
  assert.equal(place.grade, 6);
  assert.ok(place.chapter.skillIds.includes("6.long-division"));
  assert.ok(place.lessonInChapter >= 1);
  assert.ok(place.nextId);

  const nextPlace = lessonPlace(place.nextId);
  assert.ok(nextPlace !== null);
  assert.equal(nextPlace.prevId, "6.long-division");
});

test("lessonPlace returns null for an unknown skill id", () => {
  assert.equal(lessonPlace("nope"), null);
});
