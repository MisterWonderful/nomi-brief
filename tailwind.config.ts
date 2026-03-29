import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],

  typography: (theme: (path: string) => string) => ({
    DEFAULT: {
      css: {
        "--tw-prose-body": theme("colors.zinc[300]"),
        "--tw-prose-headings": theme("colors.white"),
        "--tw-prose-lead": theme("colors.zinc[400]"),
        "--tw-prose-links": theme("colors.violet[400]"),
        "--tw-prose-bold": theme("colors.white"),
        "--tw-prose-counters": theme("colors.zinc[500]"),
        "--tw-prose-bullets": theme("colors.zinc[600]"),
        "--tw-prose-hr": theme("colors.zinc.800"),
        "--tw-prose-quotes": theme("colors.zinc[300]"),
        "--tw-prose-quote-borders": theme("colors.violet[500]"),
        "--tw-prose-captions": theme("colors.zinc[500]"),
        "--tw-prose-code": theme("colors.violet[300]"),
        "--tw-prose-pre-code": theme("colors.zinc[300]"),
        "--tw-prose-pre-bg": theme("colors.zinc.900"),
        "--tw-prose-th-borders": theme("colors.zinc[700]"),
        "--tw-prose-td-borders": theme("colors.zinc[800]"),
        fontSize: "1.0625rem",
        lineHeight: "1.8",
        maxWidth: "72ch",
        a: {
          textDecoration: "none",
          borderBottom: "1px solid",
          borderColor: "rgba(139, 92, 246, 0.4)",
          transition: "border-color 0.2s",
          "&:hover": {
            borderColor: "rgba(139, 92, 246, 0.8)",
          },
        },
        h1: { fontFamily: "var(--font-playfair)", fontWeight: "700" },
        h2: { fontFamily: "var(--font-playfair)", fontWeight: "600", marginTop: "2em" },
        h3: { fontWeight: "600" },
        blockquote: {
          fontStyle: "normal",
          borderLeftWidth: "3px",
          backgroundColor: "rgba(139, 92, 246, 0.05)",
          padding: "0.75rem 1.25rem",
          borderRadius: "0 0.5rem 0.5rem 0",
        },
        "blockquote p": {
          marginTop: "0.25em",
          marginBottom: "0.25em",
        },
        pre: {
          borderRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.05)",
        },
        table: {
          borderRadius: "0.75rem",
          overflow: "hidden",
          borderCollapse: "separate",
          borderSpacing: "0",
          width: "100%",
        },
        "thead th": {
          backgroundColor: "rgba(255,255,255,0.04)",
          fontWeight: "600",
          padding: "0.75rem 1rem",
        },
        "tbody td": {
          padding: "0.625rem 1rem",
        },
        "tbody tr": {
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        },
        "tbody tr:last-child": {
          borderBottom: "none",
        },
      },
    },
  }),
};

export default config;
