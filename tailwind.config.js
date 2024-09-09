const defaultTheme = require("tailwindcss/defaultTheme")

module.exports = {
  content: ["**/*.mlx"],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '40em',
      'md': '48em',
      'lg': '64em',
      'xl': '80em',
    },
    extend: {
      colors: {
        primary_light: "#d43f00",
        primary_dark: "#c04e1d",
        sand: "#faf8f3",
        dark_blue: "#0e1f43",
      },
      typography: (theme) => ({ }),
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        montserrat: ["Montserrat", ...defaultTheme.fontFamily.sans]
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
