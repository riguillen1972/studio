"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SupportedModel } from "@/ai/genkit";

interface ModelSelectorProps {
  value: SupportedModel;
  onChange: (value: SupportedModel) => void;
  disabled?: boolean;
  className?: string;
}

export default function ModelSelector({ value, onChange, disabled, className }: ModelSelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor="model-toggle" className="mb-2 block text-sm font-medium">AI Model</Label>
      <Select value={value} onValueChange={(v: SupportedModel) => onChange(v)} disabled={disabled}>
        <SelectTrigger id="model-toggle">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="haiku">Claude 4.5 Haiku</SelectItem>
          <SelectItem value="flash">Gemini 2.5 Flash</SelectItem>
          <SelectItem value="pro">Gemini 2.0 Pro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
