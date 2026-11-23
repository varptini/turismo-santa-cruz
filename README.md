# 🚌 Turismo Santa Cruz

> **Sistema Integral de Gestión de Viajes Turísticos, Asignación Táctil de Asientos y Control de Abordaje**  
> Diseñado especialmente para la organización de excursiones saliendo desde **Cruz Grande, Guerrero**, hacia múltiples destinos turísticos de la República Mexicana.

---

## 📋 Resumen del Proyecto

**Turismo Santa Cruz** digitaliza y optimiza la operación completa de excursiones organizadas en autobuses turísticos rentados:

1. **Autobuses Rentados Dinámicos:** Soporte para diferentes capacidades de autobuses contratados (40, 44, 47 y 50 plazas) con adaptación automática del croquis.
2. **Croquis Visual e Interactivo:** Reemplazo táctil del dibujo en papel del autobús. Vista aérea en 4 columnas con pasillo central, cabina del chofer y sanitario. Los asientos reflejan en tiempo real su estado:
   - 🟢 **Disponible:** Libre para asignación inmediata.
   - 🟡 **Apartado:** Reservado con anticipo o micropagos; saldo pendiente por liquidar.
   - 🔵 **Pagado / Liquidado:** Asiento cubierto al 100%.
   - ⚪ **Bloqueado / Staff:** Plazas reservadas para choferes, copilotos u organizadores.
3. **Control Financiero y Micropagos:**
   - Registro de anticipos iniciales flexibles.
   - Abonos en cuotas intermedias (efectivo o transferencia).
   - Liquidación de saldos antes del abordaje.
4. **Reglas de Negocio según Duración:**
   - **Viajes Cortos (3 días):** Salen viernes en la tarde/noche y regresan domingo en la noche. No incluyen hospedaje ni atracciones (sólo transporte).
   - **Viajes Largos (7 días):** Salen domingo en la noche y regresan el domingo siguiente. Incluyen reservaciones de hotel, accesos y actividades pagadas.
5. **Itinerario de Ruta por Actividades:**
   - Puntos clasificados en la ruta: Balnearios, Grutas, Mercados, Centros Turísticos, Hoteles y Puntos Gastronómicos.
6. **Modo Abordaje (Pase de Lista Inteligente):**
   - Validación de pasajeros al subir al camión en Cruz Grande.
   - Alerta visual y confirmación de cobro en caso de pasajeros con adeudos pendientes.
7. **Integración con WhatsApp (+52):**
   - Generación de recibos instantáneos con un solo toque (`wa.me/52...`) con desglose de titular, asientos apartados, anticipo, abonos y saldo restante.

---

## 🛠️ Stack Tecnológico

- **Framework Web:** [Next.js 16](https://nextjs.org/) con App Router y Turbopack.
- **Renderizado:** Server-Side Rendering (SSR) y Server Actions para carga instantánea y cero pantallas en blanco.
- **Librería UI:** React 19, [Tailwind CSS v4](https://tailwindcss.com/) y [Lucide React](https://lucide.dev/).
- **Base de Datos & ORM:** SQLite con [Prisma 7](https://www.prisma.io/) y controlador `@prisma/adapter-better-sqlite3`.
- **Pruebas Automatizadas:**
  - **Vitest:** Pruebas unitarias de lógica financiera, normalización de números WhatsApp y cálculo de ocupación.
  - **Playwright:** Pruebas End-to-End (E2E) y *Chaos & Monkey Testing* (simulación de usuario destructivo) en navegadores Desktop Chromium y Mobile Chrome (Pixel 7).

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 20.x o 22.x
- npm / npx

### Instalación
```bash
# Clonar o entrar al directorio del proyecto
cd /home/varptini/Proyectos/turismo-santa-cruz

# Instalar dependencias
npm install

# Generar cliente de Prisma y ejecutar migraciones
npx prisma db push

# Sembrar datos iniciales de prueba (Tolantongo 44 plazas y Huasteca 47 plazas)
npx tsx prisma/seed.ts
```

### Ejecución en Desarrollo
```bash
npm run dev
```
> La aplicación estará disponible en `http://localhost:3000` (o `http://localhost:3001` si el 3000 está ocupado) y accesible en la red local vía `http://<TU_IP_LOCAL>:3001`.

### Ejecución en Producción
```bash
npm run build
npm run start -- -p 3001
```

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una cobertura completa de pruebas que validan desde la lógica matemática de pagos hasta la interacción táctil en dispositivos móviles:

### 1. Validación de Tipos Estrictos
```bash
npx tsc --noEmit
```
*(Garantiza 0 errores de compilación y tipado en TypeScript).*

### 2. Pruebas Unitarias (Vitest)
```bash
npm test
# o: npx vitest run
```
- **15 pruebas unitarias** que validan:
  - Formateo internacional de teléfonos mexicanos para WhatsApp (`formatWhatsAppPhone`).
  - Generación de mensajes y enlaces para recibos.
  - Cálculo de porcentajes de ocupación de autobuses.
  - Gestión de saldo pendiente y transiciones de estado de reserva.
  - Validación de paradas según tipo de viaje (Corto vs Largo).

### 3. Pruebas End-to-End y Chaos Testing (Playwright)
```bash
npx playwright test
```
- **12 pruebas E2E** ejecutadas en:
  - **Desktop Chromium**
  - **Mobile Chrome (Google Pixel 7)**
- **Escenarios cubiertos:**
  - Navegación fluida del Dashboard y carga de viajes activos.
  - Inspección del croquis del autobús y visualización de asientos en tiempo real.
  - Interacción táctil: selección de múltiples asientos y modal de reserva.
  - *Chaos Testing:* Resistencia a clics ultra rápidos, alternancia violenta entre pestañas (Croquis, Reservas, Itinerario, Abordaje).
  - *Monkey Testing:* Envío de caracteres corruptos (`<script>`, cadenas de 100+ caracteres, números negativos) en formularios sin crasheos en la UI.
  - *Modo Abordaje:* Búsquedas con caracteres especiales y filtrado sin rotura de estado.

---

## 📱 Acceso desde Dispositivos Móviles (Teléfono / Tablet)

Para que la organizadora gestione los viajes directamente desde su teléfono celular:
1. Conecta el teléfono a la misma red Wi-Fi de la computadora.
2. Abre el navegador móvil e ingresa a `http://192.168.0.15:3001` (o la IP asignada en tu red).
3. Gracias a la arquitectura Server-Side Rendering (SSR) y la configuración de `allowedDevOrigins`, la aplicación carga instantáneamente sin spinners de espera ni bloqueos de recursos.

---

## 📄 Estructura del Proyecto

```
turismo-santa-cruz/
├── e2e/                           # Suites de pruebas E2E con Playwright
│   ├── flujo-completo.spec.ts     # Pruebas de recorrido usuario y croquis
│   └── chaos-monkey.spec.ts       # Monkey testing de resistencia y caos
├── prisma/
│   ├── schema.prisma              # Modelo relacional (Viaje, Asiento, Reservacion, Parada, Abono)
│   ├── seed.ts                    # Sembrado de datos realistas de Guerrero
│   └── dev.db                     # Base de datos SQLite local
├── src/
│   ├── actions/
│   │   └── viajes.ts              # Server Actions con validaciones de negocio
│   ├── app/
│   │   ├── page.tsx               # Carga SSR del Dashboard principal
│   │   ├── HomeClient.tsx         # Vista de tarjetas de viajes
│   │   ├── viajes/[id]/
│   │   │   ├── page.tsx           # Carga SSR de detalle del viaje
│   │   │   └── ViajeDetalleClient.tsx # Coordinador de pestañas y modales
│   │   └── api/                   # Endpoints REST de contingencia
│   ├── components/
│   │   ├── CroquisAutobus.tsx     # Croquis táctil de autobús en 4 columnas
│   │   ├── ModoAbordaje.tsx       # Pase de lista y alertas de saldo deudor
│   │   ├── ModalNuevaReserva.tsx  # Formulario con cálculo dinámico
│   │   ├── ModalAbono.tsx         # Registro de micropagos
│   │   ├── ModalDetalleAsiento.tsx# Detalle individual de ocupante
│   │   ├── ItinerarioView.tsx     # Línea de tiempo de actividades turísticas
│   │   └── Navbar.tsx             # Barra superior con acción de nuevo viaje
│   ├── lib/
│   │   ├── prisma.ts              # Cliente singleton Prisma
│   │   └── whatsapp.ts            # Sanitizador telefónico y generador wa.me
│   └── __tests__/                 # Pruebas unitarias con Vitest
└── next.config.ts                 # Configuración de Turbopack y allowedDevOrigins
```

---

## 📜 Licencia
Proyecto desarrollado para la comunidad de **Cruz Grande, Guerrero, México**. Todos los derechos reservados.
