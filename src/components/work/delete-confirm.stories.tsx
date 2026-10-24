import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DeleteConfirm } from "./delete-confirm";

const meta = {
  title: "Saved work/Delete confirmation",
  component: DeleteConfirm,
  args: {
    title: "Thanksgiving and prayer",
    kind: "analysis",
    onConfirm: fn(async () => {}),
  },
} satisfies Meta<typeof DeleteConfirm>;
export default meta;
type Story = StoryObj<typeof meta>;

const open = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    canvas.getByRole("button", { name: "Delete “Thanksgiving and prayer”" }),
  );
  return canvas;
};

export const Closed: Story = {};
export const Asking: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await expect(
      canvas.getByText("Delete this analysis? This cannot be undone."),
    ).toBeVisible();
  },
};
export const AskingDark: Story = { ...Asking, globals: { theme: "dark" } };
export const CancelKeepsTheRecord: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expect(canvas.queryByRole("group")).toBeNull();
  },
};
export const ConfirmDeletes: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      within(canvas.getByRole("group")).getByRole("button", {
        name: "Delete “Thanksgiving and prayer”",
      }),
    );
    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};
export const DeleteFails: Story = {
  args: {
    onConfirm: fn(async () => {
      throw new Error("offline");
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      within(canvas.getByRole("group")).getByRole("button", {
        name: "Delete “Thanksgiving and prayer”",
      }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent(
        "It could not be deleted. Try again.",
      ),
    );
  },
};
