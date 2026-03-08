import QuizGenerator from "@/components/quiz/quiz-generator";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const quizData = resolvedParams?.quizData;
  const topic = resolvedParams?.topic;

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
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
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
