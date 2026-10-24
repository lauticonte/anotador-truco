import { getViteConfig } from "astro/config";

// Usa la misma configuración de Vite que el build de Astro (JSX, CSS, alias)
export default getViteConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{js,jsx}"],
    setupFiles: ["tests/unit/setup.js"],
  },
});
