import QuizGenerator from "@/components/quiz/quiz-generator";

export default function QuizPage() {
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
      <QuizGenerator />
    </div>
  );
}
