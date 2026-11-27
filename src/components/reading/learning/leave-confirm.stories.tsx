import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useSelectionStore } from "@/lib/learning/selection";
import { GuardedLink } from "./guarded-link";
import { LeaveConfirm } from "./leave-confirm";

function Page() {
  return (
    <div>
      <LeaveConfirm />
      <GuardedLink href="/read/john/2">Next chapter</GuardedLink>
    </div>
  );
}

const meta = {
  title: "Reading/Learning/Leave confirmation",
  component: Page,
  beforeEach: () => {
    useSelectionStore.getState().setDirty(true);
    return () => useSelectionStore.getState().setDirty(false);
  },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Asks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Next chapter" });
    await userEvent.click(link);
    await expect(canvas.getByText(/Discard your answers/)).toBeVisible();
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Keep editing" }),
      ).toHaveFocus(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Keep editing" }));
    await expect(canvas.queryByText(/Discard your answers/)).toBeNull();
    await expect(link).toHaveFocus();
    await expect(useSelectionStore.getState().dirty).toBe(true);
  },
};

export const Discards: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: "Next chapter" }));
    await userEvent.click(canvas.getByRole("button", { name: "Discard" }));
    await expect(useSelectionStore.getState().dirty).toBe(false);
    await expect(canvas.queryByText(/Discard your answers/)).toBeNull();
  },
};

export const NothingToLose: Story = {
  beforeEach: () => {
    useSelectionStore.getState().setDirty(false);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Next chapter" });
    await userEvent.click(link);
    await expect(canvas.queryByText(/Discard your answers/)).toBeNull();
  },
};
