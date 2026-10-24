import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { WorkList, type WorkListItem } from "./work-list";

const items: WorkListItem[] = [
  {
    kind: "analysis",
    id: "6f1c3a52-2b1e-4c55-9d0e-0d1f3c8a7b10",
    title: "Thanksgiving and prayer",
    passageLabel: "Philippians 1:3–11",
    updatedAt: new Date("2026-10-23T14:05:00Z"),
  },
  {
    kind: "diagram",
    id: "0b9e2d6c-91f4-4a3e-8f57-5c2a1e7d4b33",
    title: "Paul's greeting",
    passageLabel: "Philippians 1:1–2",
    updatedAt: new Date("2026-10-22T09:30:00Z"),
  },
  {
    kind: "analysis",
    id: "c7d84e1f-3a6b-4f20-b1c9-8e2f5d0a6c44",
    title: "To live is Christ",
    passageLabel: "Philippians 1:21",
    updatedAt: new Date("2026-10-20T18:45:00Z"),
  },
];

const meta = {
  title: "Saved work/Work list",
  component: WorkList,
  args: {
    items,
    onDelete: { analysis: fn(async () => {}), diagram: fn(async () => {}) },
  },
} satisfies Meta<typeof WorkList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { items: [] } };
export const SeveralRecords: Story = {
  play: async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole("listitem");
    await expect(rows).toHaveLength(3);
    await expect(
      within(rows[0]).getByRole("link", { name: "Thanksgiving and prayer" }),
    ).toHaveAttribute("href", `/analysis/${items[0].id}`);
    await expect(
      within(rows[1]).getByRole("link", { name: "Paul's greeting" }),
    ).toHaveAttribute("href", `/diagram/${items[1].id}`);
  },
};
export const LongTitle: Story = {
  args: {
    items: [
      {
        ...items[0],
        title:
          "A long working title for an analysis of the thanksgiving, which keeps going to see how the row wraps when a title runs well past the width of the column",
      },
    ],
  },
};
export const SeveralRecordsDark: Story = {
  ...SeveralRecords,
  globals: { theme: "dark" },
};
export const SeveralRecordsSepia: Story = {
  ...SeveralRecords,
  globals: { theme: "sepia" },
};
export const CancellingKeepsTheRecord: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete “To live is Christ”" }),
    );
    const cancel = canvas.getByRole("button", { name: "Cancel" });
    await expect(cancel).toHaveFocus();
    await userEvent.click(cancel);
    await expect(args.onDelete.analysis).not.toHaveBeenCalled();
    await expect(
      canvas.getByRole("link", { name: "To live is Christ" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(
      canvas.getByRole("button", { name: "Delete “To live is Christ”" }),
    ).toHaveFocus();
  },
};
export const ConfirmingDeletes: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete “Paul's greeting”" }),
    );
    const group = canvas.getByRole("group", {
      name: "Confirm deleting “Paul's greeting”",
    });
    await userEvent.click(
      within(group).getByRole("button", { name: "Delete “Paul's greeting”" }),
    );
    await expect(args.onDelete.diagram).toHaveBeenCalledWith(items[1].id);
    await expect(args.onDelete.analysis).not.toHaveBeenCalled();
  },
};
