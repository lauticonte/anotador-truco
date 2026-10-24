# Anotador de Truco

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Astro](https://img.shields.io/badge/astro-7.x-BC52EE?logo=astro)
![React](https://img.shields.io/badge/react-18.x-61DAFB?logo=react)

**Truqito** ([truco.contelautaro.com.ar](https://truco.contelautaro.com.ar)) es un anotador de Truco Argentino online y gratis: los puntos se dibujan con fósforos, como en el anotador de papel. Está pensado para el celular, sin descargar nada ni registrarse.

---

## 📑 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Pruebas](#-pruebas)
- [Despliegue](#-despliegue)
- [Changelog y Versionado](#-changelog-y-versionado)
- [Autor](#-autor)

---

## 💎 Características

* **Fósforos en SVG**: cada punto es un fósforo; se suma tocando el tablero o con los botones + y −. El fósforo que gana la partida se enciende antes de pasar al resultado.
* **Partidas a 15 o a 30**: a 30, con malas y buenas.
* **VAR**: la partida jugada por jugada, con la hora de cada punto.
* **Nombres editables** para los dos equipos.
* **La partida queda guardada** en el dispositivo (`localStorage`) aunque se cierre el navegador.
* **Guía del truco**: valores de las cartas, envido y cuánto vale cada canto.
* **Sugerencias** desde la pantalla de resultado, que llegan por Telegram.

---

## 🛠 Stack Tecnológico

* **[Astro 7](https://astro.build/)**: sitio 100 % estático. Cada página sale del build con su HTML completo (SEO y primer dibujo sin esperar al JavaScript).
* **[React 18](https://react.dev/) como islas**: solo lo interactivo (tablero, menú, resultado y anuncio) se hidrata en el navegador. Se renderiza en el build y se hidrata **después del primer dibujo** con la directiva propia `client:tras-dibujo` (`src/directivas/`).
* **[nanostores](https://github.com/nanostores/nanostores)**: estado compartido entre islas (modo de juego y nombres), en `src/stores/partida.js`.
* **CSS** propio, inline en el HTML; íconos Boxicons como máscaras SVG locales (`src/styles/Icons.css`); fuentes en woff2 servidas desde el sitio.
* **Transiciones entre páginas** con View Transitions del navegador (solo CSS).
* **Vercel**: hosting del sitio estático y funciones en `api/` (`ads.txt`, 404 real y envío de sugerencias). GA4 con web vitals reales de cada visita (`src/reportWebVitals.js`) y Vercel Analytics.

---

## 📂 Arquitectura del Proyecto

```bash
anotador-truco/
├── api/                    # Vercel Functions: ads.txt, 404 real, sugerencias a Telegram
├── public/                 # Archivos tal cual: imágenes, fuentes, robots, sitemap, llms.txt, 404.html
├── src/
│   ├── pages/              # Una página por URL
│   │   ├── index.astro               # Anotador (tablero renderizado en 0-0)
│   │   ├── guia-truco.astro          # Guía: las tres pestañas en el HTML
│   │   ├── resultado/[ganador].astro # /resultado/nosotros y /resultado/ellos
│   │   └── resultado.astro           # Cualquier otro /resultado/:winner
│   ├── layouts/Base.astro  # <head> común (meta, GA4, CMP de InMobi), header y footer
│   ├── components/         # Islas de React (Board, Counter, Menu, ResultPage, VAR…) y Footer.astro
│   ├── directivas/         # client:tras-dibujo: hidratar después del primer dibujo
│   ├── stores/partida.js   # Estado compartido entre islas
│   ├── data/               # Metadatos de las páginas y contenido de la guía
│   ├── scripts/            # JS sin React (pestañas de la guía)
│   └── styles/             # Hojas de estilo por componente
├── scripts/                # Contrato SEO, comparación entre deploys y PageSpeed
├── tests/
│   ├── unit/               # Vitest + Testing Library
│   └── contrato/           # Contrato SEO sobre el build (node:test)
├── astro.config.mjs
└── vercel.json             # Rewrites, headers (noindex en /resultado/*) y cache
```

---

## 💻 Instalación y Desarrollo

### Requisitos

* Node.js 24 (LTS)
* npm (Vercel instala con `package-lock.json`)

### Comandos

```bash
npm install          # dependencias
npm run dev          # servidor de desarrollo en http://localhost:4321
npm run build        # build de producción en dist/
npm run preview      # sirve dist/ localmente
```

> Las funciones de `api/` y las reglas de `vercel.json` (rewrites y headers) solo corren en Vercel. Para probarlas, usar el deploy de preview de la rama.

---

## ✅ Pruebas

```bash
npm test                 # unitarios: lógica de juego, store, islas, VAR, nombres
npm run build && npm run test:contrato   # contrato SEO del build contra producción
```

* **Contrato SEO** (`tests/contrato/`): title, description, canonical, Open Graph, Twitter, JSON-LD y texto de cada página tienen que ser iguales a los capturados de producción (`tests/contrato/esperado.json`). También controla el presupuesto de JavaScript de la home.
* **Comparar dos deploys URL por URL** (status, redirecciones, headers, SEO y texto):
  ```bash
  node scripts/comparar-urls.mjs https://truco.contelautaro.com.ar https://<preview>.vercel.app
  ```
* **Volver a capturar el contrato** (solo cuando producción cambia a propósito): `node scripts/capturar-contrato.mjs`.
* **PageSpeed Insights** (3 corridas mobile, mediana): `PSI_KEY=... node scripts/psi.mjs <url>`. La clave está en Bitwarden; nunca en archivos.

---

## 🚀 Despliegue

* Cada push genera un deploy de preview en Vercel; `master` es producción.
* `vercel.json` fija `framework: astro` y `outputDirectory: dist`.
* Antes de pasar a producción: tests en verde y `comparar-urls` sin diferencias inesperadas contra producción.

---

## 📜 Changelog y Versionado

El proyecto sigue [Semantic Versioning](https://semver.org/). El historial completo está en [`CHANGELOG.md`](CHANGELOG.md) y, para los usuarios, en **Novedades** dentro de la app (`src/components/Changelog.jsx`).

* **v2.0.1 (Latest) - 2026-10-30**: Publicidad diferida 2,5 s después de cargar la página, para que no compita con el primer dibujo ni con los primeros toques.
* **v2.0.0 - 2026-10-23**: Migración de Create React App a Astro con islas de React: HTML completo desde el build, tablero visible en el primer dibujo, JavaScript inicial a la mitad, fósforo ganador que se enciende, transiciones entre páginas y texto "Sobre el anotador" siempre en el HTML.
* **v1.5.0 - 2026-10-14**: Rediseño del VAR, hojas unificadas, Guía del truco en pestañas y mejoras de SEO.
* **v1.4.6 - 2026-10-14**: Fósforos realistas en SVG, guía de toque y animación al sumar.

---

## 👨‍💻 Autor

**Lautaro Conte**

* **Rol**: Full Stack Developer / Arquitecto de Software
* **GitHub**: [@lauticonte](https://github.com/lauticonte)
* **Contacto**: info@contelautaro.com.ar
