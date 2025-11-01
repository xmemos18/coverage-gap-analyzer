import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          dark: '#1e40af',
        },
        accent: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
        },
        success: '#10b981',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
};

export default config;
