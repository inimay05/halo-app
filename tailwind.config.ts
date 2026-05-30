import type { Config } from "tailwindcss";
import { COLORS } from "./src/config/tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ...COLORS,
      },
      fontFamily: {
        sans: ['Nunito', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
