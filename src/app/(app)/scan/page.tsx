import HomeworkScanner from "@/components/homework/homework-scanner";

export default function ScanPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
          Scan Homework
        </h1>
        <p className="text-muted-foreground mt-1">
          Scan a homework problem and get step-by-step help. You do the last step yourself.
        </p>
      </header>
      <HomeworkScanner />
    </div>
  );
}
