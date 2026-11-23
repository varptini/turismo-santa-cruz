# Bitácora de Cambios y Correcciones (CHANGELOG)

Todas las correcciones, mejoras y ajustes técnicos realizados en el proyecto **Turismo Santa Cruz** quedan registrados en este documento siguiendo las directrices de ingeniería y documentación obligatoria.

---

## [1.0.0] - 2026-11-23

### 🚀 Novedades y Características Principales
- **Arquitectura de Viajes y Autobuses:** Modelado relacional completo para excursiones de 3 días (cortos) y 7 días (largos) saliendo desde Cruz Grande, Guerrero.
- **Croquis Táctil Interactivo:** Renderizado visual del autobús con vista cenital en 4 columnas (2 a la izquierda, pasillo central y 2 a la derecha), con cabina del conductor y sanitario posterior. Soporta selección táctil de asientos con estados en tiempo real (Disponible, Apartado, Pagado, Bloqueado).
- **Finanzas y Micropagos:** Lógica para apartar asientos con anticipo inicial, registrar abonos subsecuentes en efectivo o transferencia, y calcular saldos pendientes automáticamente.
- **Modo Abordaje (Pase de Lista):** Interfaz para el día del viaje que filtra pasajeros por estado, identifica deudores con alerta visual y solicita confirmación antes de permitir el abordaje.
- **WhatsApp Integrado (+52):** Formateo automático de teléfonos móviles de México y generación de recibos digitales listos para enviar vía `wa.me`.
- **Suite de Pruebas Automatizadas:** 15 pruebas unitarias en Vitest y 12 pruebas E2E / Chaos Testing en Playwright (Desktop Chromium y Mobile Chrome Pixel 7).

---

### 🐛 Errores Resueltos y Análisis de Causa Raíz

#### 1. Spinner Infinito de Carga en Dispositivos Móviles (`192.168.0.15:3001`)
- **Problema:** Al acceder a la aplicación desde un teléfono celular en la red local (`http://192.168.0.15:3001`), la pantalla se quedaba congelada indefinidamente mostrando el círculo verde de carga.
- **Causa Raíz:**
  1. En Next.js con Turbopack, las solicitudes cross-origin desde IPs de red local hacia recursos de desarrollo y HMR (`/_next/hmr`, fuentes y bundles) son bloqueadas por defecto por motivos de seguridad (`Blocked cross-origin request to Next.js dev resource`).
  2. La vista principal dependía exclusivamente de un `useEffect` con `fetch('/api/viajes')` en el cliente. Al fallar o bloquearse las conexiones secundarias, el estado de carga (`loading = true`) nunca se resolvía.
- **Solución Implementada:**
  1. Se configuró `allowedDevOrigins: ['192.168.0.15', 'localhost', '127.0.0.1']` en `next.config.ts`.
  2. Se refactorizó la arquitectura a **Server-Side Rendering (SSR)**: el componente servidor `src/app/page.tsx` y `src/app/viajes/[id]/page.tsx` leen los datos directamente de la base de datos y entregan el HTML completamente renderizado (`initialViajes` y `initialViaje`), eliminando por completo la espera en el cliente para el primer renderizado.

---

#### 2. Desalineación de Columnas en el Croquis del Autobús
- **Problema:** En la vista del croquis del autobús, los asientos aparecían vacíos o agrupados incorrectamente.
- **Causa Raíz:** El script de sembrado inicial (`seed.ts`) almacenaba los nombres de columna como letras `"A"`, `"B"`, `"C"`, `"D"`, mientras que el componente `CroquisAutobus.tsx` filtraba por enumeraciones nominales (`"VENTANA_IZQ"`, `"PASILLO_IZQ"`, `"PASILLO_DER"`, `"VENTANA_DER"`).
- **Solución Implementada:**
  - Se introdujo una función de mapeo tolerante y bidireccional en `CroquisAutobus.tsx` que normaliza columnas tanto por letra (`A` -> `VENTANA_IZQ`, `B` -> `PASILLO_IZQ`, etc.) como por identificador nominal, garantizando que cualquier formato de base de datos se pinte en la posición exacta.

---

#### 3. Excepción `TypeError: Cannot read properties of undefined (reading 'toFixed')` en Modo Abordaje
- **Problema:** Al hacer clic en la pestaña de "Abordaje", la aplicación arrojaba una pantalla de error del sistema ("This page couldn't load").
- **Causa Raíz:**
  - En `src/actions/viajes.ts`, la función `getViajeById` incluía los datos de la reservación de cada asiento mediante `include.reservacion.select`, pero omitía explícitamente los campos `totalPagar` y `lugarAbordaje`.
  - En `ModoAbordaje.tsx`, la línea donde se desglosa el pago (`${asiento.reservacion.totalAbonado.toFixed(2)} / ${asiento.reservacion.totalPagar.toFixed(2)}`) intentaba ejecutar `.toFixed(2)` sobre `undefined`, provocando una excepción no capturada de JavaScript que disparaba el Error Boundary de Next.js.
- **Solución Implementada:**
  1. Se añadieron `totalPagar: true` y `lugarAbordaje: true` en el selector de Prisma de `getViajeById`.
  2. Se agregó programación defensiva con encadenamiento opcional y coalescencia nula: `(asiento.reservacion.totalPagar ?? 0).toFixed(2)` y `(asiento.reservacion.totalAbonado ?? 0).toFixed(2)`.

---

#### 4. Bloqueo de Acción en Pruebas E2E por Animación CSS en Botón Flotante
- **Problema:** Las pruebas automatizadas con Playwright fallaban por timeout esperando que el botón flotante de apartado (`#btn-apartar-flotante`) estuviera estable.
- **Causa Raíz:** El botón utilizaba una animación CSS personalizada continua (`keyframes slide-up`) que causaba fluctuaciones infinitesimales de posición durante la verificación de estabilidad de Playwright.
- **Solución Implementada:** Se reemplazó la animación personalizada con transiciones estables de opacidad de Tailwind CSS y se asignó un ID determinista (`#btn-apartar-flotante`) para asegurar interactividad instantánea tanto para usuarios reales como en pruebas automatizadas.

---

#### 5. Ausencia de Estilos Visuales (HTML sin CSS) en Dispositivos Móviles
- **Problema:** Al abrir la aplicación en el navegador del teléfono móvil, la página mostraba texto sin formato (HTML nativo sin estilos, enlaces subrayados azules/morados, botones planos sin diseño y elementos desalineados).
- **Causa Raíz:** En Next.js con Tailwind CSS v4, `@import "tailwindcss";` requiere el plugin `@tailwindcss/postcss` y el archivo `postcss.config.mjs` para compilar las clases utilitarias. Al no existir dicha configuración, el compilador solo emitía las fuentes web Geist (archivo CSS de ~3.8 KB) y omitía todas las reglas de diseño (colores, flexbox, grid, bordes y paddings).
- **Solución Implementada:**
  1. Se instaló la dependencia `@tailwindcss/postcss`.
  2. Se configuró `postcss.config.mjs` para procesar Tailwind CSS v4.
  3. Se recompiló la aplicación, produciendo el bundle de estilos completo (~42 KB) con todas las clases de diseño visual (botones esmeralda, tarjetas con bordes redondeados y croquis interactivo).
  4. Se validó la carga con 12/12 pruebas pasadas en Playwright Desktop y Mobile Chrome.
