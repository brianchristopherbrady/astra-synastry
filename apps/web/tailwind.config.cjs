module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          400: "rgb(var(--color-muted) / <alpha-value>)",
          500: "rgb(var(--color-muted) / <alpha-value>)",
        },
        midnight: "rgb(var(--color-canvas) / <alpha-value>)",
        aurora: "rgb(var(--color-action) / <alpha-value>)",
        stardust: "rgb(var(--color-accent) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        line: "rgb(var(--color-border) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
