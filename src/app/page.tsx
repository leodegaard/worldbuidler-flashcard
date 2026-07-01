import Link from "next/link";
import { CardScreen } from "@/components/CardScreen";
import { getNextCard } from "@/lib/cards";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ exclude?: string }>;
}) {
  const { exclude } = await searchParams;
  const card = await getNextCard(exclude);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      {card ? (
        <CardScreen card={card} />
      ) : (
        <p className="text-muted-foreground">
          No prompt cards yet. Seed the database to get started.
        </p>
      )}
      <nav className="flex gap-4 text-sm text-muted-foreground">
        <Link href="/history" className="underline">View saved answers</Link>
        <Link href="/lore-lens" className="underline">Lore Lens</Link>
      </nav>
    </main>
  );
}
