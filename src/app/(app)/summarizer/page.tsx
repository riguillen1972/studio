import TextSummarizer from "@/components/summarizer/text-summarizer";

export default function SummarizerPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Text Summarizer
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste any text to get a summary of the key concepts.
        </p>
      </header>
      <TextSummarizer />
    </div>
  );
}
