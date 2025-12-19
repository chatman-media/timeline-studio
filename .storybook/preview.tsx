import type { Preview } from "@storybook/react";
import React from "react";
import { withThemeByClassName } from "@storybook/addon-themes";

import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // B:;NG05< AB0=40@B=K9 background, 8A?>;L7C5< =0H8 B5<K
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    (Story) => (
      <div className="p-8" data-oid="rk2cbmh">
        <Story data-oid="3hoyt6i" />
      </div>
    ),
  ],
};

export default preview;
