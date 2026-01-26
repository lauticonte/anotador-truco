# Anotador de Truco

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.4.4-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.x-61DAFB?logo=react)

**Anotador de Truco** es una Progressive Web Application (PWA) diseñada para la gestión digital del anotador en partidas de Truco Argentino. Desarrollada con un enfoque *mobile-first*, la aplicación moderniza la experiencia tradicional mediante una interfaz interactiva, persistencia de datos y herramientas de análisis de partida.

---

## 📑 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Técnicas](#-características-técnicas)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Instalación y Despliegue](#-instalación-y-despliegue)
- [Changelog y Versionado](#-changelog-y-versionado)
- [Autor](#-autor)

---
## 💎 Características Técnicas

### Core Features
* **Sistema de Puntuación Vectorial**: Renderizado de "fósforos" interactivos mediante SVG y manipulación directa del DOM virtual.
* **VAR System (Log de Eventos)**: Registro inmutable de cada acción de puntaje con *timestamps*, permitiendo auditoría completa de la partida en tiempo real.
* **Gestión de Estado Compleja**: Manejo de modos de juego (15/30 puntos), transiciones de etapas (Malas/Buenas) y lógica de victoria determinista.
* **Feedback System**: Integración con servicios backend (Supabase/Telegram) para recolección de reportes de usuario en tiempo real.

### UX/UI & Performance
* **Progressive Web App (PWA)**: Manifest `json` configurado para instalación nativa en dispositivos móviles y funcionamiento offline.
* **Diseño Responsivo Adaptativo**: Layouts que se ajustan desde dispositivos móviles pequeños hasta entornos de escritorio.
* **Accesibilidad (a11y)**: Controles táctiles optimizados y elementos semánticos para mejorar la navegación.

---

## 🛠 Stack Tecnológico

El proyecto utiliza una arquitectura moderna basada en componentes funcionales y Hooks.

### Frontend
* **Framework**: [React 18](https://reactjs.org/) - Utilizando `Strict Mode` y las últimas features de concurrencia.
* **Routing**: [React Router v7](https://reactrouter.com/) - Para manejo de navegación SPA (Single Page Application).
* **Estilos**: CSS3 Modular con variables CSS para consistencia temática y diseño responsivo avanzado.
* **Iconografía**: FontAwesome & Boxicons integrados vía componentes SVG para menor peso.

### Backend & Servicios (BaaS)
* **Base de Datos**: [Supabase](https://supabase.com/) - Utilizado para funcionalidades en tiempo real y persistencia de feedback.
* **Analytics**: Vercel Analytics - Monitoreo de performance y *User Vitals*.
* **Hosting/CI/CD**: Vercel - Despliegues automáticos basados en integración continua con GitHub.

---

## 📂 Arquitectura del Proyecto

La estructura de directorios sigue las mejores prácticas para escalabilidad en React:

```bash
anotador-truco/
├── public/              # Assets estáticos y PWA Manifest
├── src/
│   ├── api/             # Interfaces de comunicación con servicios externos
│   ├── components/      # Componentes UI reutilizables (Board, Counter, VAR)
│   ├── config/          # Configuraciones de entorno (Supabase Client)
│   ├── context/         # React Context API para estado global (Auth, Theme)
│   ├── hooks/           # Custom Hooks (usePageMeta, lógica de juego)
│   ├── styles/          # Hojas de estilo modulares por componente
│   ├── App.js           # Componente raíz y orquestador de rutas
│   └── index.js         # Punto de entrada y montaje del DOM
├── vercel.json          # Configuración de despliegue y headers
└── package.json         # Dependencias y scripts de ejecución

```

---

## 💻 Instalación y Despliegue

### Requisitos Previos

* Node.js v16+
* NPM v8+

### Entorno de Desarrollo Local

1. **Clonar el repositorio:**
```bash
git clone [https://github.com/lauticonte/anotador-truco.git](https://github.com/lauticonte/anotador-truco.git)
cd anotador-truco

```


2. **Instalar dependencias:**
```bash
npm install

```


3. **Ejecutar servidor de desarrollo:**
```bash
npm start

```


La aplicación estará disponible en `http://localhost:3000`.
4. **Build para producción:**
```bash
npm run build

```



---

## 📜 Changelog y Versionado

El proyecto sigue [Semantic Versioning](https://semver.org/).

* **v1.4.4 (Latest) - 2026-01-02**: Hotfix de UI para scroll en modales y corrección de renderizado en botón de revisión (VAR).
* **v1.4.3**: Implementación de interacción táctil directa sobre los assets gráficos (fósforos).
* **v1.4.2**: Overhaul de contenido con integración de Guía Interactiva y optimización SEO.
* **v1.4.1**: Mejoras de performance (Lazy Loading) y optimización de assets.
* **v1.3.0**: Lanzamiento del módulo VAR y panel de historial lateral.

Para ver el historial completo de cambios, consulta el archivo `CHANGELOG.md` o la sección de novedades dentro de la aplicación.

---

## 👨‍💻 Autor

**Lautaro Conte**

* **Rol**: Full Stack Developer / Arquitecto de Software
* **GitHub**: [@lauticonte](https://github.com/lauticonte)
* **Contacto**: info@contelautaro.com.ar
