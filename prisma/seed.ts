import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCards } from "../src/lib/seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  for (const card of seedCards) {
    await db.card.upsert({
      where: { id: card.id },
      update: { category: card.category, prompt: card.prompt },
      create: {
        id: card.id,
        category: card.category,
        prompt: card.prompt,
        source: "curated",
      },
    });
  }
  console.log(`Seeded ${seedCards.length} cards.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
