export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        notion: {
          text: "#111",
          muted: "#6b7280",
          surface: "#ffffff",
          border: "#e5e7eb",
          hover: "#f5f5f5",
          "accent-hover": "#6d28d9",
          accent: "#7c3aed",
          bg: "#fafafa",
        },
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
