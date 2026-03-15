"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SupportedModel } from "@/ai/genkit";
import { useAppState } from "@/components/app-state-provider";

interface ModelSelectorProps {
  value: SupportedModel;
  onChange: (value: SupportedModel) => void;
  disabled?: boolean;
  className?: string;
}

export default function ModelSelector({ value, onChange, disabled, className }: ModelSelectorProps) {
  const { tier } = useAppState();

  // Determine which models are available for the current subscription tier
  // Free: Gemini 2.5 Flash-Lite
  // Pro:  Gemini 2.5 Flash-Lite, Gemini 2.5 Flash, Gemini 2.5 Pro
  // Max:  Gemini 2.5 Flash-Lite, Gemini 2.5 Flash, Claude 3 Haiku
  const availableModels: { value: SupportedModel; label: string }[] = [
    { value: "flash-lite", label: "Gemini 2.5 Flash-Lite" },
  ];

  if (tier === "pro" || tier === "max") {
    availableModels.push({ value: "flash", label: "Gemini 2.5 Flash" });
  }

  if (tier === "pro") {
    availableModels.push({ value: "pro", label: "Gemini 2.5 Pro" });
  }

  if (tier === "max") {
    availableModels.push({ value: "haiku", label: "Claude 3 Haiku" });
  }

  // If the currently selected model is not available for this tier, reset to flash-lite
  const effectiveValue = availableModels.some((m) => m.value === value) ? value : "flash-lite";
  if (effectiveValue !== value) {
    onChange("flash-lite");
  }

  return (
    <div className={className}>
      <Label htmlFor="model-toggle" className="mb-2 block text-sm font-medium">AI Model</Label>
      <Select value={effectiveValue} onValueChange={(v: SupportedModel) => onChange(v)} disabled={disabled || availableModels.length <= 1}>
        <SelectTrigger id="model-toggle">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
