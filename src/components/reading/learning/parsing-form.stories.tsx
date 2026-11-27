import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { CheckResult, ParsingAnswer } from "@/lib/learning/types";
import { EUXARISTW, fixtureCheck, leanPhilippians1 } from "@/stories/learning";
import { ParsingForm } from "./parsing-form";

const word = leanPhilippians1.words.find((w) => w.id === EUXARISTW)!;

const correct: ParsingAnswer = {
  wordId: EUXARISTW,
  lemma: "εὐχαριστέω",
  pos: "verb",
  fields: {
    tense: "present",
    voice: "active",
    mood: "indicative",
    person: "first",
    number: "singular",
  },
};
const partlyWrong: ParsingAnswer = {
  ...correct,
  lemma: "ευχαριστω",
  fields: { tense: "aorist", voice: "active", mood: "indicative" },
};

const check = (answer: ParsingAnswer) => {
  const result = fixtureCheck(answer);
  if (!result.ok) throw new Error("fixture refused");
  return result;
};

const meta = {
  title: "Reading/Learning/Parsing form",
  component: ParsingForm,
  args: {
    word,
    reference: "Philippians 1:3",
    onCheck: fn(async (answer: ParsingAnswer) => fixtureCheck(answer)),
    onPrevious: fn(),
    onNext: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="popover" style={{ position: "static" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ParsingForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Dictionary form")).toHaveFocus();
    // Nothing is pre-selected (FR-013).
    await expect(canvas.getByLabelText("Part of speech")).toHaveValue("");
    await expect(canvas.queryByLabelText("Tense")).toBeNull();
  },
};
export const EmptyDark: Story = { ...Empty, globals: { theme: "dark" } };
export const EmptySepia: Story = { ...Empty, globals: { theme: "sepia" } };

export const VerbIndicativeFields: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("Dictionary form"),
      "euxaristew",
    );
    await expect(canvas.getByLabelText("Dictionary form")).toHaveValue(
      "ευχαριστεω",
    );
    await userEvent.selectOptions(
      canvas.getByLabelText("Part of speech"),
      "verb",
    );
    await userEvent.selectOptions(canvas.getByLabelText("Mood"), "indicative");
    for (const label of ["Tense", "Voice", "Mood", "Person", "Number"])
      await expect(canvas.getByLabelText(label)).toBeVisible();
    await expect(canvas.queryByLabelText("Case")).toBeNull();
    await expect(canvas.queryByLabelText("Gender")).toBeNull();
  },
};

export const ParticipleFields: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(
      canvas.getByLabelText("Part of speech"),
      "participle",
    );
    for (const label of ["Tense", "Voice", "Case", "Number", "Gender"])
      await expect(canvas.getByLabelText(label)).toBeVisible();
    await expect(canvas.queryByLabelText("Mood")).toBeNull();
    // Changing part of speech drops fields that no longer apply (FR-012).
    await userEvent.selectOptions(canvas.getByLabelText("Case"), "dative");
    await userEvent.selectOptions(
      canvas.getByLabelText("Part of speech"),
      "adverb",
    );
    await expect(canvas.queryByLabelText("Case")).toBeNull();
  },
};

export const ComparedAllAgree: Story = {
  args: { initialResult: check(correct) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("All fields agree with the source."),
    ).toBeVisible();
  },
};
export const ComparedAllAgreeDark: Story = {
  ...ComparedAllAgree,
  globals: { theme: "dark" },
};

export const ComparedWithDifferences: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Dictionary form"), "euxaristw");
    await userEvent.selectOptions(
      canvas.getByLabelText("Part of speech"),
      "verb",
    );
    await userEvent.selectOptions(canvas.getByLabelText("Mood"), "indicative");
    await userEvent.selectOptions(canvas.getByLabelText("Tense"), "aorist");
    await userEvent.click(canvas.getByRole("button", { name: "Check" }));
    await waitFor(() => expect(args.onCheck).toHaveBeenCalled());
    await expect(
      await canvas.findByText("5 fields differ from the source."),
    ).toBeVisible();
    await expect(canvas.getAllByText("Unanswered")).toHaveLength(3);
    await expect(canvasElement.querySelector("output")).toHaveTextContent(
      "5 fields differ from the source",
    );
  },
};
export const ComparedWithDifferencesSepia: Story = {
  args: { initialResult: check(partlyWrong) },
  globals: { theme: "sepia" },
};

export const CheckFailed: Story = {
  args: {
    onCheck: fn<(answer: ParsingAnswer) => Promise<CheckResult>>(async () => {
      throw new Error("offline");
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("Dictionary form"),
      "euxaristew",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Check" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      /Couldn.t check this word\. Your answers are kept; try again\./,
    );
    await expect(
      canvas.getByRole("button", { name: "Check again" }),
    ).toBeVisible();
    // Answers are kept; no source value is shown.
    await expect(canvas.getByLabelText("Dictionary form")).toHaveValue(
      "ευχαριστεω",
    );
    await expect(canvas.queryByText("Source parsing")).toBeNull();
  },
};

export const PrefilledFromPreviousAttempt: Story = {
  args: {
    previous: {
      answer: partlyWrong,
      checkedAt: "2026-11-16T10:00:00.000Z",
      allAgreed: false,
      differCount: 4,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Checked before on .*: 4 differed/),
    ).toBeVisible();
    await expect(canvas.getByLabelText("Tense")).toHaveValue("aorist");
    await expect(canvas.queryByText("εὐχαριστέω")).toBeNull();
  },
};

export const NotSavedYet: Story = {
  args: { initialResult: check(correct), saveState: "pending" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("Not saved yet — retrying"),
    ).toBeVisible();
  },
};

export const EndOfChapter: Story = {
  args: {
    endOfChapter: { href: "/read/php/2", label: "Philippians 2" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("End of the chapter")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Continue with Philippians 2" }),
    ).toBeVisible();
  },
};

export const EndOfNewTestament: Story = {
  args: { endOfChapter: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("End of the New Testament")).toBeVisible();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};

export const DiscardConfirmation: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Dictionary form"), "l");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("Discard your answers?")).toBeVisible();
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Keep editing" }));
    await expect(canvas.queryByText("Discard your answers?")).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Close parsing form" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Discard" }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const EscapeClosesWhenNothingTyped: Story = {
  play: async ({ canvasElement, args }) => {
    await within(canvasElement).findByLabelText("Dictionary form");
    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};
