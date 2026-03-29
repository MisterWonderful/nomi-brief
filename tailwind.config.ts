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
      typography: (theme: (path: string) => string) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.zinc[300]"),
            "--tw-prose-headings": theme("colors.white"),
            "--tw-prose-lead": theme("colors.zinc[400]"),
            "--tw-prose-links": theme("colors.violet[400]"),
            "--tw-prose-bold": theme("colors.zinc[100]"),
            "--tw-prose-counters": theme("colors.zinc[500]"),
            "--tw-prose-bullets": theme("colors.zinc.600"),
            "--tw-prose-hr": theme("colors.zinc.800"),
            "--tw-prose-quotes": theme("colors.zinc[200]"),
            "--tw-prose-quote-borders": theme("colors.violet[500]"),
            "--tw-prose-captions": theme("colors.zinc[500]"),
            "--tw-prose-code": theme("colors.violet[300]"),
            "--tw-prose-pre-code": theme("colors.zinc[200]"),
            "--tw-prose-pre-bg": theme("colors.zinc.900"),
            "--tw-prose-th-borders": theme("colors.zinc.700"),
            "--tw-prose-td-borders": theme("colors.zinc.800"),
            // Slightly larger base size, generous line height
            fontSize: "1.125rem",
            lineHeight: "1.9",
            maxWidth: "72ch",
            color: "var(--tw-prose-body)",
            // Generous paragraph spacing
            p: {
              marginTop: "1.4em",
              marginBottom: "1.4em",
              lineHeight: "1.9",
            },
            // Bold headings with Playfair Display
            h1: {
              fontFamily: "var(--font-playfair)",
              fontWeight: "800",
              fontSize: "2.25rem",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
              marginTop: "0",
              marginBottom: "0.6em",
              color: "var(--tw-prose-headings)",
            },
            h2: {
              fontFamily: "var(--font-playfair)",
              fontWeight: "700",
              fontSize: "1.6rem",
              lineHeight: "1.3",
              letterSpacing: "-0.015em",
              marginTop: "2em",
              marginBottom: "0.75em",
              paddingBottom: "0.4em",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "var(--tw-prose-headings)",
            },
            h3: {
              fontFamily: "var(--font-playfair)",
              fontWeight: "600",
              fontSize: "1.25rem",
              lineHeight: "1.4",
              marginTop: "1.75em",
              marginBottom: "0.6em",
              color: "var(--tw-prose-headings)",
            },
            h4: {
              fontWeight: "600",
              fontSize: "1.05rem",
              lineHeight: "1.5",
              marginTop: "1.5em",
              marginBottom: "0.5em",
              color: "var(--tw-prose-headings)",
            },
            // Strong/bold text
            strong: {
              color: "var(--tw-prose-bold)",
              fontWeight: "700",
            },
            // Links
            a: {
              color: "var(--tw-prose-links)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(139, 92, 246, 0.35)",
              transition: "border-color 0.2s, color 0.2s",
              fontWeight: "500",
              "&:hover": {
                borderBottomColor: "rgba(139, 92, 246, 0.8)",
                color: "rgb(167, 139, 250)",
              },
            },
            // Lists with more space
            ul: {
              marginTop: "1.2em",
              marginBottom: "1.2em",
              paddingLeft: "1.6em",
            },
            ol: {
              marginTop: "1.2em",
              marginBottom: "1.2em",
              paddingLeft: "1.6em",
            },
            li: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
              lineHeight: "1.75",
              paddingLeft: "0.25em",
            },
            // Blockquotes — prominent and styled
            blockquote: {
              fontStyle: "normal",
              fontWeight: "400",
              color: "var(--tw-prose-quotes)",
              borderLeftWidth: "4px",
              borderLeftColor: "rgb(139, 92, 246)",
              backgroundColor: "rgba(139, 92, 246, 0.06)",
              padding: "1rem 1.5rem",
              borderRadius: "0 0.75rem 0.75rem 0",
              marginTop: "1.8em",
              marginBottom: "1.8em",
              boxShadow: "inset 0 1px 0 0 rgba(139, 92, 246, 0.2)",
              "& p": {
                marginTop: "0.35em",
                marginBottom: "0.35em",
                fontSize: "1.05em",
                lineHeight: "1.8",
              },
              strong: {
                color: "rgb(167, 139, 250)",
              },
            },
            // Code
            code: {
              fontFamily: "var(--font-mono)",
              fontSize: "0.875em",
              fontWeight: "500",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              color: "var(--tw-prose-code)",
              borderRadius: "0.375rem",
              paddingLeft: "0.4em",
              paddingRight: "0.4em",
              paddingTop: "0.15em",
              paddingBottom: "0.15em",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            // Pre blocks
            pre: {
              backgroundColor: "rgba(12, 12, 16, 0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "1rem",
              padding: "1.5rem",
              marginTop: "1.8em",
              marginBottom: "1.8em",
              overflowX: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              code: {
                backgroundColor: "transparent",
                color: "var(--tw-prose-pre-code)",
                fontSize: "0.875em",
                padding: "0",
                borderRadius: "0",
              },
            },
            // Tables with generous spacing
            table: {
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0",
              borderRadius: "0.875rem",
              overflow: "hidden",
              marginTop: "2em",
              marginBottom: "2em",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            },
            thead: {
              backgroundColor: "rgba(255,255,255,0.04)",
              th: {
                fontWeight: "700",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "rgb(229, 229, 235)",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                                      verticalAlign: "bottom",
              },
            },
            tbody: {
              tr: {
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background-color 0.15s",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.02)",
                },
                "&:last-child": {
                  borderBottom: "none",
                },
              },
              td: {
                padding: "0.875rem 1.25rem",
                verticalAlign: "top",
                fontSize: "0.9375rem",
              },
            },
            // Horizontal rules
            hr: {
              borderColor: "rgba(255,255,255,0.08)",
              borderTopWidth: "1px",
              marginTop: "3em",
              marginBottom: "3em",
            },
            // Images
            img: {
              borderRadius: "0.875rem",
              marginTop: "2em",
              marginBottom: "2em",
            },
          },
        },
      }),
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
};

export default config;
