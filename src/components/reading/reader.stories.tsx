import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { getBook } from "@/lib/books";
import { philippians1 } from "@/stories/fixtures";
import { Reader } from "./reader";

const php = getBook("PHP");
if (!php) throw new Error("Philippians is missing from the book list");

const meta = {
  title: "Reading/Reader",
  component: Reader,
  parameters: { layout: "fullscreen" },
  args: { book: php, chapter: 1 },
} satisfies Meta<typeof Reader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { content: { status: "ok", data: philippians1 } },
};
export const Unavailable: Story = {
  args: { chapter: 2, content: { status: "unavailable" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Text not yet available")).toBeVisible();
    // Navigation stays usable when the text is missing.
    await expect(
      canvas.getAllByRole("link", { name: "Next chapter: Philippians 3" })[0],
    ).toBeVisible();
  },
};
export const NotInstalled: Story = {
  args: { content: { status: "not-installed" } },
};
