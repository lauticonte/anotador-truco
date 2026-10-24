// Registra las directivas propias de Truqito en Astro
export default () => ({
  name: "truqito-directivas",
  hooks: {
    "astro:config:setup": ({ addClientDirective }) => {
      addClientDirective({
        name: "tras-dibujo",
        entrypoint: new URL("./tras-dibujo.js", import.meta.url),
      });
    },
  },
});
