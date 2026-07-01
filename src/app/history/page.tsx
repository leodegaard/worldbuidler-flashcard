import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

export default async function HistoryPage() {
  await connection();

  const answers = await db.answer.findMany({
    include: { card: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Saved answers</h1>
        <Link href="/" className="text-sm underline text-muted-foreground">
          Back to cards
        </Link>
      </div>

      {answers.length === 0 ? (
        <p className="text-muted-foreground">No answers saved yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {answers.map((answer) => (
            <li key={answer.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {answer.card.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {answer.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="mb-2 font-medium">{answer.card.prompt}</p>
              <p className="whitespace-pre-wrap text-sm">{answer.body}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
