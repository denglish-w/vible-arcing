"use server";
// Writes to saved work (app-server-and-sqlite design decision 6). Every action
// checks the request's Host first (decision 9), parses its input with zod, and
// returns a typed result for every expected outcome; anything else throws.
// Saving an analysis runs the shared validation module (through workDeps), so
// the server refuses exactly what the editor refuses.
import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAllowedHost } from "../../lib/host";
import {
  MAX_TITLE_LENGTH,
  appDb,
  createAnalysis as storeNewAnalysis,
  createDiagram as storeNewDiagram,
  deleteWork,
  saveAnalysis as storeAnalysis,
  saveDiagram as storeDiagram,
  workDeps,
  type Conflict,
  type Created,
  type Refusal,
  type Saved,
  type WorkKind,
} from "../../db/server";

const id = z.uuid();
const revision = z.int().positive();
const analysisInput = z.object({
  title: z.string().max(MAX_TITLE_LENGTH),
  docVersion: z.int(),
  doc: z.unknown(),
});
const diagramInput = analysisInput.extend({
  startWordId: z.string().min(1),
  endWordId: z.string().min(1),
});

export type AnalysisInput = z.input<typeof analysisInput>;
export type DiagramInput = z.input<typeof diagramInput>;
export type DeleteResult = { ok: true } | { ok: false; reason: "not-found" };

const badRequest: Refusal = {
  ok: false,
  reason: "invalid",
  detail: "The request is not in the expected form.",
};

export async function createAnalysis(
  input: AnalysisInput,
): Promise<Created | Refusal> {
  await assertAllowedHost();
  const parsed = analysisInput.safeParse(input);
  if (!parsed.success) return badRequest;
  const result = storeNewAnalysis(await workDeps(), parsed.data);
  if (result.ok) revalidatePath("/work");
  return result;
}

export async function saveAnalysis(
  analysisId: string,
  baseRevision: number,
  input: AnalysisInput,
): Promise<Saved | Conflict | Refusal> {
  await assertAllowedHost();
  const parsed = z
    .tuple([id, revision, analysisInput])
    .safeParse([analysisId, baseRevision, input]);
  if (!parsed.success) return badRequest;
  const result = storeAnalysis(await workDeps(), ...parsed.data);
  if (result.ok) revalidatePath("/work");
  return result;
}

export async function createDiagram(
  input: DiagramInput,
): Promise<Created | Refusal> {
  await assertAllowedHost();
  const parsed = diagramInput.safeParse(input);
  if (!parsed.success) return badRequest;
  const result = storeNewDiagram(await workDeps(), parsed.data);
  if (result.ok) revalidatePath("/work");
  return result;
}

export async function saveDiagram(
  diagramId: string,
  baseRevision: number,
  input: DiagramInput,
): Promise<Saved | Conflict | Refusal> {
  await assertAllowedHost();
  const parsed = z
    .tuple([id, revision, diagramInput])
    .safeParse([diagramId, baseRevision, input]);
  if (!parsed.success) return badRequest;
  const result = storeDiagram(await workDeps(), ...parsed.data);
  if (result.ok) revalidatePath("/work");
  return result;
}

async function remove(kind: WorkKind, recordId: string): Promise<DeleteResult> {
  await assertAllowedHost();
  const parsed = id.safeParse(recordId);
  if (!parsed.success) return { ok: false, reason: "not-found" };
  const result = deleteWork(await appDb(), kind, parsed.data);
  revalidatePath("/work");
  return result;
}

export async function deleteAnalysis(analysisId: string) {
  return remove("analysis", analysisId);
}

export async function deleteDiagram(diagramId: string) {
  return remove("diagram", diagramId);
}
