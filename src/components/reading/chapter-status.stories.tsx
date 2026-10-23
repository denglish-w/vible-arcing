import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChapterLoading, ChapterUnavailable } from "./chapter-status";

const meta = {
  title: "Reading/Chapter status",
  component: ChapterUnavailable,
} satisfies Meta<typeof ChapterUnavailable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { render: () => <ChapterLoading /> };
export const Unavailable: Story = {};
