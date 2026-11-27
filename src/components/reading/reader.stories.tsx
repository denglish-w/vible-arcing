import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { getBook } from "@/lib/books";
import { philippians1 } from "@/stories/fixtures";
import { fakeActions, leanPhilippians1 } from "@/stories/learning";
import { resetSettings } from "@/stories/with-settings";
import { Reader } from "./reader";

const php = getBook("PHP");
if (!php) throw new Error("Philippians is missing from the book list");

const meta = {
  title: "Reading/Reader",
  component: Reader,
  parameters: { layout: "fullscreen" },
  args: { book: php, chapter: 1, actions: fakeActions },
  beforeEach: resetSettings,
} satisfies Meta<typeof Reader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { content: { status: "ok", mode: "reading", data: philippians1 } },
};
export const Unavailable: Story = {
  args: { chapter: 2, content: { status: "unavailable", mode: "reading" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Text not available")).toBeVisible();
    // Navigation stays usable when the text is missing.
    await expect(
      canvas.getAllByRole("link", { name: "Next chapter: Philippians 3" })[0],
    ).toBeVisible();
  },
};
export const NotInstalled: Story = {
  args: { content: { status: "not-installed", mode: "reading" } },
};

export const Learning: Story = {
  parameters: { settings: { posColor: { enabled: true } } },
  args: {
    content: {
      status: "ok",
      mode: "learning",
      data: leanPhilippians1,
      attempts: {},
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Learning mode is on. Select a word to parse it."),
    ).toBeVisible();
    // No colouring or legend in Learning mode (FR-004).
    await expect(canvas.queryByLabelText("Part-of-speech legend")).toBeNull();
    const word = canvas.getByRole("button", {
      name: "Εὐχαριστῶ, parse this word",
    });
    await expect(word.getAttribute("style")).toBeNull();
  },
};
export const LearningUnavailable: Story = {
  args: { chapter: 2, content: { status: "unavailable", mode: "learning" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Text not available")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Learning" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};
export const LearningNotInstalled: Story = {
  args: { content: { status: "not-installed", mode: "learning" } },
};
