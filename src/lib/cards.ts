import { db } from "@/lib/db";

type CountedCard = { _count: { answers: number } };

export function chooseSourcePool<T>(curated: T[], generated: T[], random = Math.random) {
  if (curated.length > 0 && generated.length > 0) {
    return random() < 0.5 ? curated : generated;
  }
  return curated.length > 0 ? curated : generated;
}

export function pickLeastAnswered<T extends CountedCard>(pool: T[], random = Math.random) {
  if (pool.length === 0) return null;
  const minCount = Math.min(...pool.map((card) => card._count.answers));
  const leastAnswered = pool.filter((card) => card._count.answers === minCount);
  return leastAnswered[Math.floor(random() * leastAnswered.length)];
}

async function getPools(excludeId?: string) {
  const include = {
    _count: { select: { answers: true } },
    loreQuestion: { include: { sourceNote: true } },
  } as const;
  const exclusion = excludeId ? { id: { not: excludeId } } : {};
  const [curated, generated] = await Promise.all([
    db.card.findMany({ where: { active: true, source: "curated", ...exclusion }, include }),
    db.card.findMany({ where: { active: true, source: "generated", ...exclusion }, include }),
  ]);
  return { curated, generated };
}

export async function getNextCard(excludeId?: string) {
  let pools = await getPools(excludeId);
  if (pools.curated.length === 0 && pools.generated.length === 0 && excludeId) {
    pools = await getPools();
  }
  return pickLeastAnswered(chooseSourcePool(pools.curated, pools.generated));
}
