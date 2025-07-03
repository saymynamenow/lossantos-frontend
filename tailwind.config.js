module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundOpacity: {
        10: "0.1",
        20: "0.2",
        95: "0.95",
      },
    },
  },
  plugins: [],
  corePlugins: {
    backgroundOpacity: true,
    preflight: false,
  },
};
