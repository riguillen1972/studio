import HomeworkHelper from "@/components/homework/homework-helper";

export default function HomeworkPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          Homework Help
        </h1>
        <p className="text-muted-foreground mt-1">
          Stuck on a problem? Describe it below to get helpful hints.
        </p>
      </header>
      <HomeworkHelper />
    </div>
  );
}
