import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { fixtureWord } from "@/stories/fixtures";
import { WordDetail } from "./word-detail";

const meta = {
  title: "Reading/Word detail",
  component: WordDetail,
  // WordDetail's close button needs a popover around it, as in the reader.
  decorators: [
    (Story) => (
      <Popover open>
        <PopoverAnchor>
          <span>Anchor</span>
        </PopoverAnchor>
        <PopoverContent
          className="word-detail"
          lang="en"
          aria-label="Word details"
        >
          <Story />
        </PopoverContent>
      </Popover>
    ),
  ],
} satisfies Meta<typeof WordDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

const detail = (canvasElement: HTMLElement) =>
  within(canvasElement.ownerDocument.body).getByRole("dialog", {
    name: "Word details",
  });

export const FiniteVerb: Story = {
  args: { word: fixtureWord("n50001003001") },
  play: async ({ canvasElement }) => {
    const dialog = within(detail(canvasElement));
    await expect(dialog.getByText("Verb (finite)")).toBeVisible();
    for (const field of ["person", "number", "tense", "voice", "mood"])
      await expect(dialog.getByText(field, { selector: "dt" })).toBeVisible();
    for (const field of ["case", "gender"])
      await expect(dialog.queryByText(field, { selector: "dt" })).toBeNull();
  },
};
export const Participle: Story = {
  args: { word: fixtureWord("n50001004013") },
};
export const Noun: Story = {
  args: { word: fixtureWord("n50001001001") },
  play: async ({ canvasElement }) => {
    const dialog = within(detail(canvasElement));
    await expect(dialog.getByText("Noun")).toBeVisible();
    await expect(dialog.queryByText("tense", { selector: "dt" })).toBeNull();
    await expect(dialog.getByText("case", { selector: "dt" })).toBeVisible();
  },
};
