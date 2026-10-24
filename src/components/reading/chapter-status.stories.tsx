import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChapterNotInstalled, ChapterUnavailable } from "./chapter-status";

const meta = {
  title: "Reading/Chapter status",
  component: ChapterUnavailable,
} satisfies Meta<typeof ChapterUnavailable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unavailable: Story = {};
export const NotInstalled: Story = { render: () => <ChapterNotInstalled /> };
