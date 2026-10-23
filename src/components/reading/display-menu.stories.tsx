import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { resetSettings } from "@/stories/with-settings";
import { DisplayMenu } from "./display-menu";
import { PosLegend } from "./pos-legend";

const meta = {
  title: "Reading/Display menu",
  component: DisplayMenu,
  beforeEach: resetSettings,
  // The legend sits beside the menu as it does on the reading screen.
  render: () => (
    <>
      <DisplayMenu />
      <PosLegend />
    </>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Display settings" }),
    );
  },
} satisfies Meta<typeof DisplayMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ColouringOff: Story = {};
export const ColouringOn: Story = {
  parameters: { settings: { posColor: { enabled: true } } },
};
export const ColouringOnDark: Story = {
  ...ColouringOn,
  globals: { theme: "dark" },
};
export const ColouringOnSepia: Story = {
  ...ColouringOn,
  globals: { theme: "sepia" },
};
export const SwitchingCategoryOffUpdatesLegend: Story = {
  parameters: { settings: { posColor: { enabled: true } } },
  play: async (context) => {
    await meta.play(context);
    const { canvasElement } = context;
    const legend = within(canvasElement).getByLabelText(
      "Part-of-speech legend",
    );
    await expect(within(legend).getByText("Noun")).toBeVisible();
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("switch", {
        name: "Noun",
      }),
    );
    await waitFor(() => expect(within(legend).queryByText("Noun")).toBeNull());
    await expect(within(legend).getByText("Participle")).toBeVisible();
  },
};
