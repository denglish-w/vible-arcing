import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FONT_OPTIONS, SIZE_SCALE } from "@/lib/settings";
import { philippians1 } from "@/stories/fixtures";
import { resetSettings } from "@/stories/with-settings";
import { GreekText } from "./greek-text";

const meta = {
  title: "Reading/Greek text",
  component: GreekText,
  args: { data: philippians1 },
  beforeEach: resetSettings,
} satisfies Meta<typeof GreekText>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
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
export const ParticiplesOnly: Story = {
  parameters: {
    settings: {
      posColor: {
        enabled: true,
        categories: {
          verb: false,
          participle: true,
          infinitive: false,
          noun: false,
          adj: false,
          det: false,
          pron: false,
          prep: false,
          conj: false,
          adv: false,
          other: false,
        },
      },
    },
  },
};
export const VerseNumbersOff: Story = {
  parameters: { settings: { showVerseNumbers: false } },
};
export const LargestAndSpacious: Story = {
  parameters: {
    settings: { fontSizeIndex: SIZE_SCALE.length - 1, lineSpacing: "spacious" },
  },
};
export const GentiumPlus: Story = {
  parameters: { settings: { fontFamily: FONT_OPTIONS[1].value } },
  play: async ({ canvasElement }) => {
    const text = canvasElement.querySelector<HTMLElement>(".greek-text")!;
    await expect(text.style.fontFamily).toContain("--font-gentium");
    // The variable resolves to a loaded face, not the bare serif fallback.
    await expect(getComputedStyle(text).fontFamily).toMatch(/Gentium/);
  },
};
export const Cardo: Story = {
  parameters: { settings: { fontFamily: FONT_OPTIONS[2].value } },
};
export const GfsDidot: Story = {
  parameters: { settings: { fontFamily: FONT_OPTIONS[3].value } },
};

export const EscapeReturnsFocus: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const word = within(canvasElement).getByRole("button", {
      name: "Παῦλος, word details",
    });
    word.focus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await body.findByRole("dialog", { name: "Word details: Παῦλος" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(word).toHaveFocus();
  },
};
export const SelectingAnotherWordMovesPopover: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Παῦλος, word details" }),
    );
    await body.findByRole("dialog", { name: "Word details: Παῦλος" });
    await userEvent.click(
      canvas.getByRole("button", { name: "Τιμόθεος, word details" }),
    );
    await expect(
      await body.findByRole("dialog", { name: "Word details: Τιμόθεος" }),
    ).toBeVisible();
    await waitFor(() => expect(body.getAllByRole("dialog")).toHaveLength(1));
  },
};
