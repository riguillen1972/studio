
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
import { Loader2, Sparkles } from 'lucide-react';

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
  const { canMakeRequest, incrementRequestCount } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleGenerate = () => {
    if (!canMakeRequest()) {
      setOutput("You have reached your daily request limit. Please upgrade or try again tomorrow.");
      return;
    }
    setIsLoading(true);
    incrementRequestCount();

    // In a real application, you would call a specific Genkit flow here
    // based on the `tool.name`. For this prototype, we'll just simulate a response.
    setTimeout(() => {
      setOutput(`This is a simulated AI response for the "${tool?.name}" tool. You entered: "${input}"`);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state when closing
      setInput('');
      setOutput('');
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
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
                <Button onClick={handleGenerate} disabled={isLoading || !canMakeRequest() || !input}>
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
                {output ? (
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
