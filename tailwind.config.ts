import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        "surface-2": "#1a1a1a",
        border: "#222222",
        primary: "#7f49c3",
        "primary-dim": "#5c3491",
        muted: "#a1a1aa",
        phantom: {
          50: "#f3eeff",
          100: "#e8ddff",
          200: "#d0baff",
          300: "#b28fff",
          400: "#9b6bff",
          500: "#7f49c3",
          600: "#6a3aa8",
          700: "#552d88",
          800: "#3f2067",
          900: "#2a1445",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px #7f49c360" },
          "50%": { boxShadow: "0 0 20px #7f49c3aa" },
        },
      },
      boxShadow: {
        glow: "0 0 20px #7f49c340",
        "glow-md": "0 0 30px #7f49c360",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
