"use client";

import { useActionState } from "react";
import {
  generateLoreBatchAction,
  previewLoreGenerationAction,
} from "@/app/lore-lens/actions";
import { Button } from "@/components/ui/button";
import { GenerateLoreButton } from "@/components/GenerateLoreButton";

const initialState: { preview: string | null; error: string | null } = {
  preview: null,
  error: null,
};

export function LoreGenerationForm({ disabled }: { disabled: boolean }) {
  const [debugState, debugAction, debugPending] = useActionState(
    previewLoreGenerationAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <form action={generateLoreBatchAction} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Focus
          <select
            name="focus"
            defaultValue="balanced"
            className="h-9 rounded-lg border bg-background px-3"
          >
            <option value="balanced">Balanced</option>
            <option value="campaign">Campaign</option>
            <option value="world">World</option>
            <option value="characters">Characters</option>
          </select>
        </label>
        <GenerateLoreButton disabled={disabled || debugPending} debugPending={debugPending} />
        <Button
          type="submit"
          variant="outline"
          formAction={debugAction}
          disabled={disabled || debugPending}
        >
          {debugPending ? "Building preview…" : "Preview API payload"}
        </Button>
      </form>

      {debugState.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {debugState.error}
        </p>
      )}
      {debugState.preview && (
        <section className="space-y-2" aria-live="polite">
          <div>
            <h3 className="font-medium">Debug API payload</h3>
            <p className="text-sm text-muted-foreground">
              This is the complete request content. Nothing was sent to OpenAI and no usage was
              recorded.
            </p>
          </div>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-4 text-xs">
            {debugState.preview}
          </pre>
        </section>
      )}
    </div>
  );
}
