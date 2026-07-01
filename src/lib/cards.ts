import { db } from "@/lib/db";

export async function getNextCard(excludeId?: string) {
  const cards = await db.card.findMany({
    where: {
      active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { _count: { select: { answers: true } } },
  });

  const pool =
    cards.length > 0
      ? cards
      : await db.card.findMany({
          where: { active: true },
          include: { _count: { select: { answers: true } } },
        });

  if (pool.length === 0) return null;

  const minCount = Math.min(...pool.map((c) => c._count.answers));
  const leastAnswered = pool.filter((c) => c._count.answers === minCount);
  return leastAnswered[Math.floor(Math.random() * leastAnswered.length)];
}
