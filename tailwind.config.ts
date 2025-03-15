import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      body: [
        "UDEV Gothic JPDOC",
      ],
    },
  },
  plugins: [],
};
export default config;