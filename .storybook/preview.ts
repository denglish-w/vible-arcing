import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    // PRODUCT.md requires WCAG 2.2 AA, so axe violations fail the story.
    a11y: { test: "error" },
  },
};

export default preview;
