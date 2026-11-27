import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ModeControl } from "./mode-control";

const meta = {
  title: "Reading/Learning/Mode control",
  component: ModeControl,
  args: {
    mode: "reading",
    setReadingMode: fn(async () => ({ ok: true })),
    reload: fn(),
  },
} satisfies Meta<typeof ModeControl>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Reading: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Reading" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Learning" }));
    await waitFor(() => expect(args.reload).toHaveBeenCalledOnce());
    await expect(args.setReadingMode).toHaveBeenCalledWith("learning");
  },
};
export const Learning: Story = {
  args: { mode: "learning" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Reading" }));
    await waitFor(() =>
      expect(args.setReadingMode).toHaveBeenCalledWith("reading"),
    );
    // Back to Reading reveals nothing, so no reload is needed.
    await expect(args.reload).not.toHaveBeenCalled();
  },
};
export const LearningDark: Story = {
  args: { mode: "learning" },
  globals: { theme: "dark" },
};
