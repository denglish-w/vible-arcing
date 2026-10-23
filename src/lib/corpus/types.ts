export const MORPHOLOGY_FIELDS = [
  "person",
  "number",
  "gender",
  "case",
  "tense",
  "voice",
  "mood",
  "degree",
] as const;
export type Morphology = Partial<
  Record<(typeof MORPHOLOGY_FIELDS)[number], string>
>;
export interface CorpusWord {
  id: string;
  v: number;
  text: string;
  after: string;
  lemma: string;
  gloss: string;
  pos: string;
  m: Morphology;
}
export interface CorpusChapter {
  format: 1;
  edition: string;
  source: { dataset: string; commit: string };
  book: string;
  chapter: number;
  words: CorpusWord[];
}
