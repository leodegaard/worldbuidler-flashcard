import type { LoreFocus } from "./config";

export type ScannedNote = {
  id: string;
  name: string;
  path: string;
  focus: Exclude<LoreFocus, "balanced">;
  modifiedTime: Date;
  content: string;
  contentHash: string;
  links: string[];
  headings: string[];
  gapScore: number;
  gapSignals: string[];
};

export type ScanResult = {
  notes: ScannedNote[];
  warnings: string[];
};

export type GeneratedQuestion = {
  prompt: string;
  category: string;
  sourceFileId: string;
  rationale: string;
  gapType: string;
};
