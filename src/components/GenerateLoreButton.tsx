"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function GenerateLoreButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} aria-disabled={disabled || pending}>
      <span aria-live="polite">{pending ? "Generating…" : "Generate 10 questions"}</span>
    </Button>
  );
}
