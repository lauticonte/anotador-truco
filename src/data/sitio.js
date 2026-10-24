// Metadatos compartidos por las páginas (los mismos que tenía public/index.html)
export const SITE_URL = "https://truco.contelautaro.com.ar";

export const HOME = {
  title: "Anotador de Truco Argentino online y gratis | Truqito",
  ogTitle: "Anotador de Truco Argentino online y gratis",
  description:
    "Anotá los puntos del truco desde el celular, sin descargar nada: partidas a 15 o a 30, malas y buenas, con fósforos como en papel. Gratis.",
  canonical: `${SITE_URL}/`,
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Anotador de Truco",
    description: "Aplicación online para anotar los puntos de tu partida de truco",
    url: "https://truco.contelautaro.com.ar",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
    },
    author: {
      "@type": "Person",
      name: "Lautaro Conte",
    },
  },
};
