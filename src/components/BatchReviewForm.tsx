"use client";

import { useState } from "react";
import { approveLoreBatchAction } from "@/app/lore-lens/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DraftQuestion = {
  id: string;
  prompt: string;
  category: string;
  gapType: string;
  rationale: string;
  sourceNoteId: string;
  sourceNoteName: string;
};

export function BatchReviewForm({
  batchId,
  questions,
}: {
  batchId: string;
  questions: DraftQuestion[];
}) {
  const [selected, setSelected] = useState(() => new Set(questions.map((question) => question.id)));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={approveLoreBatchAction} className="space-y-4">
      <input type="hidden" name="batchId" value={batchId} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSelected(new Set(questions.map((question) => question.id)))}
        >
          Select all
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setSelected(new Set())}>
          Clear selection
        </Button>
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
      </div>
      <ul className="space-y-3">
        {questions.map((question) => (
          <li key={question.id} className="rounded-lg border p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="questionId"
                value={question.id}
                checked={selected.has(question.id)}
                onChange={() => toggle(question.id)}
                className="mt-1 size-4"
              />
              <span className="space-y-2">
                <span className="block font-medium">{question.prompt}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">{question.category}</Badge>
                  <span>{question.gapType}</span>
                  <a
                    href={`https://drive.google.com/open?id=${question.sourceNoteId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {question.sourceNoteName}
                  </a>
                </span>
                <span className="block text-sm text-muted-foreground">{question.rationale}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button type="submit" disabled={selected.size === 0}>Approve selected</Button>
    </form>
  );
}
