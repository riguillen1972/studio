# How the Study Buddy Math Textbook Teaches

Research notes and the lesson blueprint every textbook lesson follows (grades 6–8, NAD
Elementary Mathematics Standards, 2012). The pre-writing script (`scripts/prewrite-textbook.ts`)
gives these rules to the writer, and the two hand-written model lessons in `content/textbook/`
show them in action.

## The goal

Teach real grade-level math, the full NAD standard rather than an easier version, in a way that
**doesn't feel hard**. The difficulty stays the same. What changes is how it's presented: small
steps, a lot of support at first, and a mentor who catches mistakes kindly.

## What the research says, and what each lesson does about it

| Research | What it found | What the lesson does |
|---|---|---|
| **Cognitive load theory** (Sweller) | Working memory holds only a few new things at once. Too much at once and students feel lost, even if each piece is easy. | One idea per page. Each lesson is cut into 2–4 *parts*, and each part teaches one step of the skill. Short paragraphs, plain words, no clutter. |
| **Worked examples and fading** (Renkl; Miller-Cotto and Medrano, 6th graders) | Beginners learn more by studying a solved problem than by solving cold. Removing steps one by one (fading) gave the biggest gains, especially for students with less background. | Every part has a fully worked example, revealed one step at a time, each with a *why*. Then support fades: the first Try It is close to the example, the next is a little different, and the worksheet has no steps at all. |
| **Rosenshine's Principles of Instruction** | Review first, present in small steps, check understanding often, guided practice with about 80% success, then independent practice. | Warm-up review → small parts → a Try It after every part → worksheet. Problems start easy enough that most students get them right, then climb. |
| **Retrieval practice and interleaving** (Rohrer: 7th graders, randomized trial) | Pulling something from memory strengthens it. Mixing problem types (interleaving) beat doing one type in a row, especially for students who were struggling. | Each lesson opens with a 2-question warm-up from earlier skills. The worksheet mixes in 1–2 review problems and switches between problem types. |
| **Elaborated feedback** (Van der Kleij meta-analysis: 40 studies, computer-based learning) | Just marking "wrong" barely helps. Explaining why helps most, especially in math. | When a Try It or worksheet answer is wrong, the mentor names the likely mistake ("It looks like you forgot to bring down the 6") and gives a hint, not just ✗. Right answers get a short *why it works*. |
| **Self-explanation** (Rittle-Johnson meta-analysis) | Asking students to explain why a step works gives small-to-moderate gains. Structured choices work better than open "explain" boxes. | "Think" problems ask *which step is right* or *why* as multiple choice. Every example step has a *why*. |
| **Error analysis** | Studying a wrong solution and fixing it builds understanding and catches common misconceptions early. | A *Spot the mistake* page shows a student's wrong work, asks what went wrong, and shows the fix. The worksheet has one error-analysis problem. |
| **Concrete → Representational → Abstract (CRA)** | Starting from a real situation and a picture or table, then moving to symbols, helped middle schoolers of every achievement level (231-student algebra study). | Each lesson starts with a real situation, shows a model (a table, number line in words, or ratio table) when it helps, and only then the shortcut or rule. |
| **Math anxiety** (Namkung: 243 sixth graders) | Worry thoughts ("I'm bad at math") hurt performance, and skills matter too. Partly worked problems help anxious students. | Calm, friendly language. Never "this is easy" (it makes a struggling student feel worse). The mentor says "not yet", gives hints in levels, and Try Its are partly worked first. |
| **Growth mindset** (Yeager national study, 12,000 students) | A short message that ability grows with effort gave modest gains for lower-achieving students, more where the environment supported it. | The mentor praises strategy and effort, never "you're smart", and treats mistakes as part of learning. Feedback is about what to do next. |
| **Interest and context** (Walkington) | Problems set in things students care about are solved faster and more accurately, especially when turning a story into math. | Word problems use situations a 6th–8th grader knows: sports, games, cooking, money, pets, school events, outdoors, music. |
| **Pedagogical agents** (Mayer's principles) | A friendly guide who points to the material, talks conversationally ("you", "we") and is polite helps learning. | The mentor sits beside the page, says one helpful thing about each page, reacts to Try Its, and can be asked anything. |
| **Practice guide: problem solving, grades 4–8** (IES, 2012) | Teach students to use visual representations, compare strategies, and monitor their own thinking. | Models and tables, an occasional "two ways to solve it", and a question-first habit: *What is it asking? What do I know?* |

## The lesson blueprint

Each lesson is one skill. It's built in this order:

1. **Start**
   - A short hook: a real situation in 2–3 sentences, ending with the question the lesson answers.
   - The goal, written as "I can …".
   - 2–4 words to know, each with a meaning and a tiny example.
2. **Warm-up.** Two quick questions from skills the student already learned (retrieval). They're short, so the lesson starts with a win.
3. **Parts** (2–4). Each part is one step of the skill and contains:
   - **Read:** 2–4 short paragraphs. Start from the situation or a model, then name the rule. Bold the key words.
   - **Model** (when it helps): a small table, such as a ratio table, place-value chart, or data list.
   - **Example:** a fully worked problem with 3–6 steps. Each step says what to do and *why*.
   - **Try It** (1–2 per part): first close to the example, then a little different. Each Try It has two hints (gentle, then specific), a solution, and the wrong answers students are likely to give, each with feedback that names the mistake.
   - **Mentor line:** what the mentor says on this page, warm and specific, in 1–2 sentences.
4. **Spot the mistake.** A student's wrong work on a typical problem, what went wrong, and how to fix it.
5. **Wrap-up**
   - 3 key ideas to remember.
   - A brief faith connection, only when it fits naturally (most lessons have none).
6. **Worksheet** (10–12 problems), in this order:
   - *Practice* (4): like the Try Its, getting harder.
   - *Apply* (3): word problems in real situations, at least one with two steps.
   - *Think* (2): multiple choice about why, which method, or spotting an error.
   - *Review* (1–2): earlier skills (interleaving).
   - *Challenge* (1): the full depth of the standard.

   Every problem has hints, a solution and likely wrong answers. A student who needs help gets a hint from the mentor first, can ask the mentor anything, and sees the full solution after trying.

## Writing rules

- **Grade level is not negotiable.** Numbers and problems match the NAD standard and what a grade 6–8 textbook would ask. Make the presentation easier, never the math.
- **Small steps, not fewer steps.** If a skill has a hard part, give it its own part and example rather than skipping it.
- **Never call something "easy" or "simple."** Say "Here's a trick" or "Let's break it down."
- **Plain, friendly sentences** a 12-year-old can read aloud. Use "you", "we" and "let's".
- **Accuracy first.** Every number is computed and checked. Teach the method students actually use, and leave out extra claims that aren't needed.
- **Answers the app can check.**
  - Numeric answers are a single number, and fractions are allowed.
  - Multiple choice has 3–4 choices, exactly one of them correct.
  - If an answer depends on rounding or π, the question says how to round.
- **Plain text only:** 3/4 for fractions, 5^2 for powers, a minus sign for negatives. Use **bold** for key words.
- **Faith connections are short and natural:**
  - Stewardship with money.
  - Order in creation with patterns and geometry.
  - Honesty with data.
  - Give a Scripture reference rather than a long quote, and don't preach.

## Sources

- IES What Works Clearinghouse, [*Improving Mathematical Problem Solving in Grades 4 Through 8*](https://ies.ed.gov/ncee/wwc/practiceguide/16) (2012)
- Miller-Cotto and Medrano, [fading worked examples with 6th graders](https://escholarship.org/uc/item/2854h4v0); [Worked-example effect](https://en.wikipedia.org/wiki/Worked-example_effect)
- [Rosenshine's Principles of Instruction](https://www.innerdrive.co.uk/blog/guide-rosenshine-10-principles/)
- Rohrer et al., [interleaved math practice, 7th grade randomized trial](https://ies.ed.gov/ncee/WWC/Study/88770); [Rohrer 2014](https://link.springer.com/article/10.3758/s13423-014-0588-3)
- Van der Kleij, Feskens and Eggen (2015), [feedback in computer-based learning](https://ris.utwente.nl/ws/files/6806219/effects.pdf)
- Rittle-Johnson, Durkin and Loehr (2017), [self-explanation meta-analysis](https://link.springer.com/article/10.1007/s11858-017-0834-z)
- Witzel et al., [CRA algebra with middle schoolers](https://files.eric.ed.gov/fulltext/EJ797683.pdf)
- Namkung, [math anxiety in middle schoolers](https://www.udel.edu/udaily/2024/january/jessica-namkung-math-anxiety-middle-school-students/)
- Yeager et al. (2019), [national growth mindset experiment](https://news.psu.edu/story/582986/2019/08/07/research/study-shows-benefits-changing-students-mindsets-about-learning)
- Walkington, [personalized word problems](https://www.edweek.org/teaching-learning/studies-find-payoff-in-personalizing-algebra/2012/09)
- NAD, [Elementary Mathematics Standards](https://adventisteducation.org/elementary-standards)
