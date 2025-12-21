import QuizGenerator from "@/components/quiz/quiz-generator";

export default function QuizPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const quizData = searchParams?.quizData;
  const topic = searchParams?.topic;

  let initialQuiz = null;
  if (typeof quizData === 'string') {
    try {
      initialQuiz = JSON.parse(quizData);
    } catch (e) {
      console.error("Failed to parse quiz data from URL", e);
    }
  }

  const initialTopic = typeof topic === 'string' ? topic : undefined;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Quiz Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a quiz on any topic to test your knowledge.
        </p>
      </header>
      <QuizGenerator initialQuiz={initialQuiz} initialTopic={initialTopic} />
    </div>
  );
}
