import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LearningNotice } from "./learning-notice";

const meta = {
  title: "Reading/Learning/Notice",
  component: LearningNotice,
} satisfies Meta<typeof LearningNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Sepia: Story = { globals: { theme: "sepia" } };
