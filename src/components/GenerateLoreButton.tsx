"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function GenerateLoreButton({
  disabled,
  debugPending = false,
}: {
  disabled: boolean;
  debugPending?: boolean;
}) {
  const { pending } = useFormStatus();
  const isGenerating = pending && !debugPending;

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
    >
      <span aria-live="polite">
        {isGenerating ? "Generating…" : "Generate 10 questions"}
      </span>
    </Button>
  );
}
