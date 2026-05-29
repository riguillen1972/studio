"use client";

import { useEffect } from "react";
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
  // Free: Gemma 3 1B only
  // Pro:  Gemini 2.5 Flash, Gemini 2.5 Pro
  // Max:  Gemini 2.5 Flash, Claude Haiku 4.5
  const availableModels: { value: SupportedModel; label: string }[] = [];

  if (tier === "free") {
    availableModels.push({ value: "gemma3", label: "Gemini 2.5 Flash-Lite" });
  }

  if (tier === "pro") {
    availableModels.push({ value: "flash", label: "Gemini 2.5 Flash" });
    availableModels.push({ value: "pro", label: "Gemini 2.5 Pro" });
  }

  if (tier === "max") {
    availableModels.push({ value: "flash", label: "Gemini 2.5 Flash" });
    availableModels.push({ value: "haiku", label: "Claude Haiku 4.5" });
  }

  // Determine the correct default for this tier
  const defaultModel: SupportedModel = tier === "max" ? "haiku" : tier === "pro" ? "flash" : "gemma3";

  // If the currently selected model is not available for this tier, reset to the tier default
  const isCurrentValid = availableModels.some((m) => m.value === value);
  const effectiveValue = isCurrentValid ? value : defaultModel;

  // Use effect to call onChange only when needed (avoid calling during render)
  useEffect(() => {
    if (!isCurrentValid) {
      onChange(defaultModel);
    }
  }, [tier, isCurrentValid, defaultModel, onChange]);

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
