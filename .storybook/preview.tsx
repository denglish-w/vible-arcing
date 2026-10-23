import type { Preview } from "@storybook/nextjs-vite";
import { useLayoutEffect } from "react";
import { cardo, didot, garamond, gentium } from "../src/app/fonts";
import "../src/app/globals.css";

const fontClasses = [garamond, gentium, cardo, didot].map(
  (font) => font.variable,
);

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    // PRODUCT.md requires WCAG 2.2 AA, so axe violations fail the story.
    a11y: { test: "error" },
  },
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "sepia", title: "Sepia" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string;
      // Same classes on <html> as ThemeSync sets in the app.
      // Before paint and before play functions and axe run.
      useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.add(...fontClasses);
        root.classList.toggle("dark", theme === "dark");
        root.classList.toggle("sepia", theme === "sepia");
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
