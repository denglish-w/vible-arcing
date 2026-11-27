// The one validation of parsing answers and attempts (spec 010 FR-024;
// data-model "Validation before insert"), shared by the form and the actions.
// Script-safe: relative `.ts` imports only (src/db/README.md).
import { z } from "zod";
import {
  FIELD_VALUES,
  FORM_POS,
  fieldsFor,
  type FieldName,
  type FormPos,
} from "./fields.ts";

export const MAX_LEMMA_LENGTH = 200;

const fieldNames = Object.keys(FIELD_VALUES) as FieldName[];

const fields = z.strictObject(
  Object.fromEntries(
    fieldNames.map((name) => [
      name,
      z.enum(FIELD_VALUES[name] as [string, ...string[]]).optional(),
    ]),
  ) as Record<FieldName, z.ZodOptional<z.ZodEnum<Record<string, string>>>>,
);

export const parsingAnswer = z
  .object({
    wordId: z.string().regex(/^n\d{11}$/),
    lemma: z.string().max(MAX_LEMMA_LENGTH),
    pos: z.union([z.enum(FORM_POS), z.literal("")]),
    fields,
  })
  .superRefine((answer, ctx) => {
    const allowed = new Set<string>(fieldsFor(answer.pos, answer.fields.mood));
    for (const [key, value] of Object.entries(answer.fields)) {
      if (value !== undefined && !allowed.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["fields", key],
          message: `${key} does not apply to this part of speech.`,
        });
    }
  });

export const attemptInput = z.object({
  id: z.uuid(),
  answer: parsingAnswer,
});

export type ParsingAnswer = {
  wordId: string;
  lemma: string;
  pos: FormPos | "";
  fields: Partial<Record<FieldName, string>>;
};
export type AttemptInput = { id: string; answer: ParsingAnswer };
