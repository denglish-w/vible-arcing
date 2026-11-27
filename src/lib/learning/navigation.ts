// Moving word by word through a chapter in reading order (spec 010 FR-029).

/** The id `step` words from `id`, crossing verses; null past either end. */
export function adjacentWord(
  words: readonly { id: string }[],
  id: string,
  step: 1 | -1,
): string | null {
  const index = words.findIndex((word) => word.id === id);
  if (index === -1) return null;
  return words[index + step]?.id ?? null;
}
