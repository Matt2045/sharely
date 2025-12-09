# Sharely

Sharely ist eine moderne **Fullstack-Anwendung**, inspiriert von Pinterest, die es ermöglicht, Bilder (JPG, PNG) hochzuladen, zu teilen und KI-gestützt zu organisieren. Die Kernfunktion der App ist die Integration der **Google Gemini API**, welche jedes hochgeladene Bild automatisch analysiert und Metadaten wie Titel, Beschreibung und Tags generiert.

**Unsplash API** wird genutzt, um neuen Usern ein automatisches Userbild zuzuweisen. 

Die Bilder werden in einem Masonry-Layout angezeigt und können geliked oder gespeichert werden. Über den persönlichen Nutzerbereich lassen sich eigene Bilder, gelikte Bilder und gespeicherte Bilder einsehen.
Ein dedizierter Detailbereich zeigt pro Bild alle generierten Metadaten übersichtlich an.

Die Anwendung bietet vollständige **Login- und Registrierungsmöglichkeiten**, nutzt **Appwrite** als Backend und bietet eine moderne, performante Architektur mit SSR, React Router v7, Tailwind CSS 4 und Vite 6.

Für **Fehler- und Performance-Monitoring** kommt **Sentry** zum Einsatz, inklusive Session-Replays (Screenshots & Videoaufzeichnungen), um Fehler effizient analysieren zu können.

Die Anwendung läuft vollständig produktionsreif auf meinem eigenen VPS. Das Deployment erfolgt als Docker-Container, der über Docker Compose orchestriert wird.
Das Projekt ist unter einer Subdomain meiner persönlichen Website öffentlich erreichbar.



## Core Framework

- **React 19**
- **React DOM 19**

## Routing / Server Renderning

- **react-router v7**
- **react-router/node**

## Deployment / Hosting

- **Docker Setup**

## UI / Styling

- **Tailwind CSS 4**

## UI-Komponenten

- **Syncfusion React Komponenten**

## KI / GenAI

- **Google generative AI - Google Gemini API**

## Backend / API / Auth

- **Appwrite**
  - Auth
  - Datenbank
  - Storage
  - Collections

## Monitoring / Logging

- **Sentry**
  - Fehlertracking
  - Performance Monitoring
  - Profiling

## Developer Tooling

- **TypeScript 5.8**
- **Vite 6**

## TL:DR

React 19 • React Router v7 (Full-Stack) • TypeScript • Vite 6 • Tailwind 4 • Appwrite Backend
Syncfusion Komponenten • Masonry/Grid Layout • Sentry Monitoring
Google Generative AI Integration • SSR • Docker-ready • Unsplash API Integration











