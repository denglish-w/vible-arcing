import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { getBook } from "@/lib/books";
import { ChapterNavigation } from "./chapter-navigation";

const meta = {
  title: "Reading/Chapter navigation",
  component: ChapterNavigation,
} satisfies Meta<typeof ChapterNavigation>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MiddleChapter: Story = {
  args: { book: getBook("PHP")!, chapter: 2 },
};
export const Matthew1: Story = {
  args: { book: getBook("MAT")!, chapter: 1 },
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement);
    await expect(
      nav.queryByRole("link", { name: /^Previous chapter/ }),
    ).toBeNull();
    await expect(
      nav.getByRole("link", { name: "Next chapter: Matthew 2" }),
    ).toBeVisible();
  },
};
export const Revelation22: Story = {
  args: { book: getBook("REV")!, chapter: 22 },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("link", { name: /^Next chapter/ }),
    ).toBeNull();
  },
};
export const Matthew28ToMark1: Story = {
  args: { book: getBook("MAT")!, chapter: 28 },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("link", { name: "Next chapter: Mark 1" }),
    ).toHaveAttribute("href", "/read/mrk/1");
  },
};
