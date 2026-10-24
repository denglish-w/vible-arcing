import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import attribution from "../../../corpus/v1/attribution.json";
import { AttributionList } from "./attribution-list";

const meta = {
  title: "Chrome/Attribution",
  component: AttributionList,
  // The committed ingest output, which the corpus store is seeded from.
  args: { entries: attribution.datasets },
} satisfies Meta<typeof AttributionList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Sources: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "SBL Greek New Testament" }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole("link", { name: "CC BY 4.0" })[0],
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
    await expect(
      canvas.getAllByText(/^Modified for this application:/),
    ).toHaveLength(3);
  },
};
export const SourcesDark: Story = { ...Sources, globals: { theme: "dark" } };
export const Unmodified: Story = {
  args: {
    entries: [{ ...attribution.datasets[0], modified: false }],
  },
};
