export const LORE_MODEL = "gpt-5.4-mini-2026-03-17";
export const MONTHLY_BUDGET_MICROS = 2_000_000;
export const MAX_INPUT_TOKENS = 100_000;
export const MAX_OUTPUT_TOKENS = 5_000;
export const MAX_RUN_COST_MICROS = 97_500;
export const MAX_ACTIVE_GENERATED_CARDS = 30;
export const MAX_PRIMARY_NOTES = 15;
export const MAX_RELATED_NOTES = 10;

export const LORE_CATEGORIES = [
  "npc",
  "location",
  "faction",
  "history",
  "conflict",
  "culture",
  "character",
  "item",
  "story",
] as const;

export type LoreCategory = (typeof LORE_CATEGORIES)[number];
export type LoreFocus = "campaign" | "world" | "characters" | "balanced";

const DEFAULT_ROOTS = {
  campaign: "1kREaxxGXnQpNDWBbH0r0kDIxsBYw82kj",
  world: "1LEirO4PJ6ET8_8VvpxzAchddrkivHv9E",
  characters: "1RIR6u09-ot5j9MO-VLw_SPMGl6R6FQse",
} satisfies Record<Exclude<LoreFocus, "balanced">, string>;

export function getDriveRoots() {
  return {
    campaign:
      process.env.GOOGLE_DRIVE_CAMPAIGN_FOLDER_ID ?? DEFAULT_ROOTS.campaign,
    world: process.env.GOOGLE_DRIVE_WORLD_FOLDER_ID ?? DEFAULT_ROOTS.world,
    characters:
      process.env.GOOGLE_DRIVE_CHARACTERS_FOLDER_ID ?? DEFAULT_ROOTS.characters,
  } satisfies Record<Exclude<LoreFocus, "balanced">, string>;
}

export const EXCLUDED_FOLDER_NAMES = new Set(
  [
    ".obsidian",
    "_assets",
    "sourcebooks",
    "07 reference",
    "99 archive",
    "99 old prep",
    "01 session prep",
    "02 session logs",
    "xx_templates",
    "snippets",
  ].map((name) => name.toLowerCase()),
);

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
