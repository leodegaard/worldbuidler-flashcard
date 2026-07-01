import { createHash } from "node:crypto";
import {
  MAX_PRIMARY_NOTES,
  MAX_RELATED_NOTES,
  type LoreFocus,
} from "./config";
import type { ScannedNote } from "./types";

const LINK_PATTERN = /!??\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
const HEADING_PATTERN = /^#{1,6}\s+(.+)$/gm;
const EXPLICIT_GAP_PATTERN =
  /\b(TBD|TODO|FIXME|unknown|unnamed|undecided)\b|\?{2,}|^#{1,6}\s+[^\n?]+\?\s*$/gim;

export function normalizeNoteName(value: string): string {
  return value
    .replace(/\.md$/i, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function extractWikiLinks(markdown: string): string[] {
  const links = new Set<string>();
  for (const match of markdown.matchAll(LINK_PATTERN)) {
    const target = match[1]?.trim();
    if (target) links.add(normalizeNoteName(target));
  }
  return [...links];
}

export function prepareMarkdownForModel(markdown: string): string {
  return markdown.replace(/!\[\[([^\]]+)\]\]/g, "[Embedded asset: $1]");
}

export function inspectMarkdown(markdown: string) {
  const headings = [...markdown.matchAll(HEADING_PATTERN)].map((match) =>
    match[1].trim(),
  );
  const explicitMatches = [...markdown.matchAll(EXPLICIT_GAP_PATTERN)];
  const emptyHeadings = headings.filter((heading) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^#{1,6}\\s+${escaped}\\s*(?:---\\s*)?(?=^#|$)`, "gim").test(
      markdown,
    );
  });
  const meaningfulLength = markdown
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/!\[\[[^\]]+\]\]/g, "")
    .trim().length;
  const signals: string[] = [];
  let score = 0;

  if (meaningfulLength === 0) {
    score += 60;
    signals.push("empty note");
  } else if (meaningfulLength < 250) {
    score += 35;
    signals.push("sparse note");
  } else if (meaningfulLength < 700) {
    score += 15;
    signals.push("short note");
  }

  if (explicitMatches.length > 0) {
    score += Math.min(45, explicitMatches.length * 12);
    signals.push("explicit placeholder or open question");
  }

  if (emptyHeadings.length > 0) {
    score += Math.min(30, emptyHeadings.length * 8);
    signals.push("empty section");
  }

  const links = extractWikiLinks(markdown);
  if (links.length > 0) {
    score += Math.min(10, links.length);
    signals.push("linked lore relationships");
  }

  return { headings, links, gapScore: score, gapSignals: signals };
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function questionFingerprint(prompt: string): string {
  const normalized = prompt
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalized).digest("hex");
}

function focusMatches(note: ScannedNote, focus: LoreFocus) {
  return focus === "balanced" || note.focus === focus;
}

export function selectPrimaryNotes(notes: ScannedNote[], focus: LoreFocus) {
  const eligible = notes
    .filter((note) => focusMatches(note, focus))
    .sort(
      (a, b) =>
        b.gapScore - a.gapScore ||
        b.modifiedTime.getTime() - a.modifiedTime.getTime(),
    );

  if (focus !== "balanced") return eligible.slice(0, MAX_PRIMARY_NOTES);

  const selected: ScannedNote[] = [];
  for (const area of ["campaign", "world", "characters"] as const) {
    selected.push(...eligible.filter((note) => note.focus === area).slice(0, 2));
  }
  for (const note of eligible) {
    if (selected.length >= MAX_PRIMARY_NOTES) break;
    if (!selected.some((candidate) => candidate.id === note.id)) selected.push(note);
  }
  return selected;
}

export function selectRelatedNotes(
  allNotes: ScannedNote[],
  primaryNotes: ScannedNote[],
): ScannedNote[] {
  const byName = new Map(
    allNotes.map((note) => [normalizeNoteName(note.name), note] as const),
  );
  const backlinks = new Map<string, Set<string>>();
  for (const note of allNotes) {
    for (const link of note.links) {
      const target = byName.get(link);
      if (!target) continue;
      const sourceIds = backlinks.get(target.id) ?? new Set<string>();
      sourceIds.add(note.id);
      backlinks.set(target.id, sourceIds);
    }
  }

  const byId = new Map(allNotes.map((note) => [note.id, note] as const));
  const primaryIds = new Set(primaryNotes.map((note) => note.id));
  const distance = new Map<string, number>();
  let frontier = primaryNotes.map((note) => note.id);

  for (let depth = 1; depth <= 2; depth += 1) {
    const next = new Set<string>();
    for (const id of frontier) {
      const note = byId.get(id);
      if (!note) continue;
      const neighbors = new Set<string>(backlinks.get(id) ?? []);
      for (const link of note.links) {
        const target = byName.get(link);
        if (target) neighbors.add(target.id);
      }
      for (const neighborId of neighbors) {
        if (primaryIds.has(neighborId) || distance.has(neighborId)) continue;
        distance.set(neighborId, depth);
        next.add(neighborId);
      }
    }
    frontier = [...next];
  }

  return [...distance.entries()]
    .map(([id, depth]) => ({ note: byId.get(id), depth }))
    .filter((entry): entry is { note: ScannedNote; depth: number } => !!entry.note)
    .sort(
      (a, b) =>
        a.depth - b.depth ||
        b.note.gapScore - a.note.gapScore ||
        b.note.modifiedTime.getTime() - a.note.modifiedTime.getTime(),
    )
    .slice(0, MAX_RELATED_NOTES)
    .map((entry) => entry.note);
}
