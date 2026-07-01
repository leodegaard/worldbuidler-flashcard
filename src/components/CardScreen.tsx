import { saveAnswer, skipCard } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function CardScreen({
  card,
}: {
  card: {
    id: string;
    category: string;
    prompt: string;
    source: string;
    loreQuestion: null | {
      rationale: string;
      sourceNoteId: string;
      sourceNote: { name: string };
    };
  };
}) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <Badge variant="secondary" className="w-fit capitalize">
          {card.category}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {card.loreQuestion && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge>Lore Lens</Badge>
              <a
                href={`https://drive.google.com/open?id=${card.loreQuestion.sourceNoteId}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {card.loreQuestion.sourceNote.name}
              </a>
            </div>
            <p className="text-muted-foreground">{card.loreQuestion.rationale}</p>
          </div>
        )}
        <form className="space-y-4">
          <p className="text-lg font-medium">{card.prompt}</p>
          <input type="hidden" name="cardId" value={card.id} />
          <Textarea name="body" placeholder="Write your answer..." rows={6} />
          <div className="flex gap-2">
            <Button formAction={saveAnswer} type="submit">
              Save &amp; Next
            </Button>
            <Button formAction={skipCard} type="submit" variant="outline">
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
