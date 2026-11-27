import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useSelectionStore } from "@/lib/learning/selection";
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
export const SwitchFails: Story = {
  args: {
    setReadingMode: fn(async () => {
      throw new Error("offline");
    }),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Learning" }));
    await waitFor(() =>
      expect(canvas.getByText(/could not be changed/)).toBeVisible(),
    );
    await expect(args.reload).not.toHaveBeenCalled();
  },
};

export const UncheckedAnswers: Story = {
  beforeEach: () => {
    useSelectionStore.getState().setDirty(true);
    return () => useSelectionStore.getState().setDirty(false);
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const learning = canvas.getByRole("button", { name: "Learning" });
    await userEvent.click(learning);
    await expect(canvas.getByText(/Discard your answers/)).toBeVisible();
    // Focus moves into the question, and returns to the button on Keep editing.
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Keep editing" }),
      ).toHaveFocus(),
    );
    await expect(args.setReadingMode).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Keep editing" }));
    await expect(canvas.queryByText(/Discard your answers/)).toBeNull();
    await expect(learning).toHaveFocus();
    await expect(useSelectionStore.getState().dirty).toBe(true);
  },
};
export const DiscardAnswers: Story = {
  beforeEach: UncheckedAnswers.beforeEach,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Learning" }));
    await userEvent.click(canvas.getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(args.reload).toHaveBeenCalledOnce());
    await expect(useSelectionStore.getState().dirty).toBe(false);
  },
};
