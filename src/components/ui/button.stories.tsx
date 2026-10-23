import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Display" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <SlidersHorizontal size={16} />
        <span>Display</span>
      </>
    ),
  },
};
export const IconOnly: Story = {
  args: {
    "aria-label": "Display settings",
    children: <SlidersHorizontal size={16} />,
  },
};
export const Disabled: Story = { args: { disabled: true } };
