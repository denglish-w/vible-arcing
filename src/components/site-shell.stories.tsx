import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChiRho, LabelStrip, Logo, PageShell, SiteFooter } from "./site-shell";

const meta = {
  title: "Chrome/Site shell",
  component: PageShell,
} satisfies Meta<typeof PageShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ChiRhoMark: Story = {
  args: { children: null },
  render: () => (
    <div style={{ width: 88 }}>
      <ChiRho />
    </div>
  ),
};
export const LogoLink: Story = {
  args: { children: null },
  render: () => <Logo />,
};
export const Footer: Story = {
  args: { children: null },
  render: () => <SiteFooter />,
};
export const Shell: Story = {
  args: {
    children: (
      <>
        <h1>Page title</h1>
        <p>Page content sits between the header and the footer.</p>
      </>
    ),
  },
};
export const ShellDark: Story = { ...Shell, globals: { theme: "dark" } };
export const ShellSepia: Story = { ...Shell, globals: { theme: "sepia" } };
export const NarrowShell: Story = { args: { ...Shell.args, narrow: true } };
export const Labels: Story = {
  args: { children: null },
  render: () => (
    <LabelStrip
      left="Greek · SBLGNT"
      right={<span lang="grc">προς φιλιππησιους 1</span>}
    />
  ),
};
