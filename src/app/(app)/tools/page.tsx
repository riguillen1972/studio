
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/components/app-state-provider';
import toolData from '@/lib/tools.json';
import * as LucideIcons from 'lucide-react';
import { ToolDialog } from '@/components/tools/tool-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-provider';

const careerCategoryMap: Record<string, string[]> = {
  'Computer Science': ["Math", "Science", "General Learning"],
  'Engineering': ["Math", "Science", "General Learning"],
  'Medicine / Pre-Med': ["Science", "Math", "General Learning"],
  'Nursing': ["Science", "Math", "General Learning"],
  'Biology / Life Sciences': ["Science", "Math", "General Learning"],
  'Business / Finance': ["Math", "Reading & Writing", "General Learning"],
  'Law / Pre-Law': ["Reading & Writing", "Grammar & Language Arts", "General Learning"],
  'Political Science': ["Reading & Writing", "Grammar & Language Arts", "General Learning"],
  'Psychology': ["Science", "Reading & Writing", "General Learning"],
  'Education': ["Grammar & Language Arts", "Reading & Writing", "Math", "Science", "General Learning"],
  'Arts & Design': ["Grammar & Language Arts", "Reading & Writing", "General Learning"],
  'Communications / Media': ["Grammar & Language Arts", "Reading & Writing", "General Learning"],
  'Architecture': ["Math", "Science", "General Learning"],
  'Mathematics': ["Math", "Science", "General Learning"],
  'Other': ["Math", "Science", "Grammar & Language Arts", "Reading & Writing", "General Learning"]
};

type Tool = {
  name: string;
  description: string;
  input_prompt: string;
};

type ToolCategory = {
  name: string;
  icon: keyof typeof LucideIcons;
  tools: Tool[];
};

type ToolDialogState = {
  isOpen: boolean;
  tool: Tool | null;
};

export default function ToolsPage() {
  const { tier } = useAppState();
  const { user } = useAuth();
  const [dialogState, setDialogState] = useState<ToolDialogState>({ isOpen: false, tool: null });

  const role = user?.user_metadata?.role || 'student';
  const careerField = user?.user_metadata?.career_field;

  const handleToolClick = (tool: Tool) => {
    setDialogState({ isOpen: true, tool });
  };

  const getVisibleTools = (tools: Tool[]): Tool[] => {
    if (tier !== 'free') {
      return tools;
    }
    return tools.slice(0, Math.ceil(tools.length / 2));
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            AI Tools Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Powerful AI-powered tools to help you with any subject.
          </p>
        </header>

        <div className="space-y-12">
          {(toolData.categories as ToolCategory[])
            .filter((category) => {
              if (role === 'college' && careerField && careerCategoryMap[careerField]) {
                return careerCategoryMap[careerField].includes(category.name);
              }
              return true; // Show all for other roles
            })
            .map((category) => {
            const Icon = (LucideIcons[category.icon as keyof typeof LucideIcons] || LucideIcons.WandSparkles) as React.ElementType;
            const visibleTools = getVisibleTools(category.tools);
            const hiddenCount = category.tools.length - visibleTools.length;

            return (
              <section key={category.name}>
                <div className="flex items-center gap-3 mb-6">
                  <Icon className="h-7 w-7 text-primary" />
                  <h2 className="text-2xl font-bold font-headline">
                    {category.name}
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleTools.map((tool) => (
                    <Card key={tool.name} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {tool.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <CardDescription>
                          {tool.description}
                        </CardDescription>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => handleToolClick(tool)}
                          className="w-full"
                        >
                          Use Tool
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  {tier === 'free' && hiddenCount > 0 && (
                    <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-primary">
                      <LucideIcons.Gem className="h-10 w-10 text-primary mb-4" />
                      <CardTitle className="mb-2 font-headline">Unlock {hiddenCount} More Tools</CardTitle>
                      <CardDescription className="mb-4">Upgrade to Pro or Max to get access to all {category.tools.length} {category.name} tools.</CardDescription>
                      <Button asChild>
                        <Link href="/profile">Upgrade Now</Link>
                      </Button>
                    </Card>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ToolDialog
        isOpen={dialogState.isOpen}
        tool={dialogState.tool}
        onClose={() => setDialogState({ isOpen: false, tool: null })}
      />
    </>
  );
}
