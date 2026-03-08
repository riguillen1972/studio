'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { useAppState } from '../app-state-provider';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ModelSelector from '@/components/model-selector';
import { SupportedModel } from '@/ai/genkit';
import { runToolAction } from '@/lib/actions';

type Tool = {
  name: string;
  description: string;
  input_prompt: string;
};

interface ToolDialogProps {
  isOpen: boolean;
  tool: Tool | null;
  onClose: () => void;
}

export function ToolDialog({ isOpen, tool, onClose }: ToolDialogProps) {
  const { hasTokens, consumeTokens } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<SupportedModel>('haiku');

  const handleGenerate = async () => {
    if (!tool || !input || !hasTokens(selectedModel)) return;

    setIsLoading(true);
    setError(null);
    setOutput('');

    const result = await runToolAction({
      toolName: tool.name,
      toolDescription: tool.description,
      userInput: input,
      model: selectedModel,
    });

    if (result.success) {
      consumeTokens(result.data.totalTokens, selectedModel);
      setOutput(result.data.response);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setInput('');
      setOutput('');
      setError(null);
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] sm:h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{tool.name}</DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow grid grid-rows-2 gap-4 overflow-hidden">
            <div className="flex flex-col gap-2">
                <Textarea
                    placeholder={tool.input_prompt}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-full resize-none"
                    disabled={isLoading}
                />
                <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={isLoading} />
                <Button onClick={handleGenerate} disabled={isLoading || !hasTokens(selectedModel) || !input}>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <Sparkles className="mr-2" /> Generate
                        </>
                    )}
                </Button>
            </div>
             <ScrollArea className="border rounded-md p-4 bg-muted/50">
                {error ? (
                    <div className="flex items-start gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                ) : output ? (
                    <p className="text-sm whitespace-pre-wrap">{output}</p>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>AI output will appear here.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
