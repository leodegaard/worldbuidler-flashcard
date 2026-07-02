import { connection } from "next/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BatchReviewForm } from "@/components/BatchReviewForm";
import { LoreGenerationForm } from "@/components/LoreGenerationForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import {
  MAX_ACTIVE_GENERATED_CARDS,
  MONTHLY_BUDGET_MICROS,
} from "@/lib/lore-lens/config";
import { getMonthlyUsageMicros } from "@/lib/lore-lens/service";
import {
  discardLoreBatchAction,
  disconnectGoogleAction,
} from "./actions";

function dollars(micros: number) {
  return `$${(micros / 1_000_000).toFixed(3)}`;
}

export default async function LoreLensPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; connected?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const [googleConnection, batches, usageMicros, activeGenerated] = await Promise.all([
    db.googleConnection.findUnique({ where: { id: "primary" } }),
    db.loreBatch.findMany({
      where: { status: "draft" },
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          where: { status: "draft" },
          include: { sourceNote: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getMonthlyUsageMicros(),
    db.card.count({ where: { source: "generated", active: true, answers: { none: {} } } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lore Lens</h1>
          <p className="text-muted-foreground">
            Find focused worldbuilding gaps in your Obsidian lore.
          </p>
        </div>
        <Link href="/" className="text-sm underline text-muted-foreground">
          Back to cards
        </Link>
      </header>

      {(params.success || params.connected) && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {params.success ?? params.connected}
        </p>
      )}
      {params.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {params.error}
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Google Drive</CardTitle>
            <CardDescription>Read-only OAuth connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {googleConnection ? (
              <>
                <p className="break-all text-sm">{googleConnection.accountEmail ?? "Connected"}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/api/google/connect"
                    className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium"
                  >
                    Reconnect
                  </a>
                  <form action={disconnectGoogleAction}>
                    <Button type="submit" variant="outline">Disconnect</Button>
                  </form>
                </div>
              </>
            ) : (
              <a
                href="/api/google/connect"
                className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
              >
                Connect Google Drive
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly budget</CardTitle>
            <CardDescription>Hard application limit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {dollars(usageMicros)} <span className="text-sm font-normal">/ $2.00</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (usageMicros / MONTHLY_BUDGET_MICROS) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active questions</CardTitle>
            <CardDescription>Unanswered Lore Lens cards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {activeGenerated} <span className="text-sm font-normal">/ {MAX_ACTIVE_GENERATED_CARDS}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Generate a batch</CardTitle>
          <CardDescription>
            Lore is read transiently. Raw note content is never stored in the app database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoreGenerationForm disabled={!googleConnection} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Draft batches</h2>
          <p className="text-sm text-muted-foreground">
            Select the questions worth adding; unselected questions are remembered as rejected.
          </p>
        </div>
        {batches.length === 0 ? (
          <p className="rounded-lg border p-4 text-muted-foreground">No draft batches yet.</p>
        ) : (
          batches.map((batch) => {
            const warnings = Array.isArray(batch.warnings)
              ? batch.warnings.filter((warning): warning is string => typeof warning === "string")
              : [];
            return (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="capitalize">{batch.focus} batch</CardTitle>
                    <Badge variant="secondary">{dollars(batch.costMicros)}</Badge>
                    <Badge variant="outline">{batch.questions.length} drafts</Badge>
                  </div>
                  <CardDescription>{batch.createdAt.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {warnings.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                      <p className="font-medium">Scan warnings</p>
                      <ul className="list-disc pl-5">
                        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    </div>
                  )}
                  <BatchReviewForm
                    batchId={batch.id}
                    questions={batch.questions.map((question) => ({
                      id: question.id,
                      prompt: question.prompt,
                      category: question.category,
                      gapType: question.gapType,
                      rationale: question.rationale,
                      sourceNoteId: question.sourceNoteId,
                      sourceNoteName: question.sourceNote.name,
                    }))}
                  />
                  <form action={discardLoreBatchAction}>
                    <input type="hidden" name="batchId" value={batch.id} />
                    <Button type="submit" variant="outline">Discard batch</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </main>
  );
}
