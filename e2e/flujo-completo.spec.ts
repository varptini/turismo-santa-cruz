import { test, expect } from "@playwright/test";

test.describe("Flujo Principal de Turismo Santa Cruz", () => {
  test("Carga del dashboard y visualización de viajes", async ({ page }) => {
    // 1. Acceder a la página principal
    await page.goto("/");
    await expect(page).toHaveTitle(/Turismo Santa Cruz/i);

    // 2. Verificar Navbar y encabezado principal
    await expect(page.getByText("Turismo Santa Cruz")).toBeVisible();
    await expect(page.getByText(/Gestiona tus viajes/i)).toBeVisible();

    // 3. Verificar que los viajes pre-cargados estén visibles
    const tarjetaTolantongo = page.getByRole("heading", { name: /Tolantongo/i });
    await expect(tarjetaTolantongo).toBeVisible();

    const tarjetaHuasteca = page.getByRole("heading", { name: /Huasteca Potosina/i });
    await expect(tarjetaHuasteca).toBeVisible();

    // 4. Verificar etiquetas de viaje Corto (3 días) y Largo (7 días)
    await expect(page.getByText("3 días").first()).toBeVisible();
    await expect(page.getByText("7 días").first()).toBeVisible();
  });

  test("Navegación al detalle del viaje y visualización del croquis", async ({ page }) => {
    await page.goto("/");

    // Click en la tarjeta de Tolantongo
    await page.getByRole("heading", { name: /Tolantongo/i }).click();

    // Esperar a que cargue la vista de detalle
    await expect(page.getByRole("heading", { name: /Tolantongo/i })).toBeVisible();

    // Verificar las 4 pestañas operativas por sus IDs deterministas
    await expect(page.locator("#tab-croquis")).toBeVisible();
    await expect(page.locator("#tab-reservas")).toBeVisible();
    await expect(page.locator("#tab-itinerario")).toBeVisible();
    await expect(page.locator("#tab-abordaje")).toBeVisible();

    // Verificar leyenda de estados del autobús
    await expect(page.getByText("Disponible").first()).toBeVisible();
    await expect(page.getByText("Apartado").first()).toBeVisible();
    await expect(page.getByText("Pagado").first()).toBeVisible();
    await expect(page.getByText("Bloqueado").first()).toBeVisible();

    // Verificar cabina del autobús (Chofer y Puerta)
    await expect(page.getByText(/CONDUCTOR/i)).toBeVisible();
  });

  test("Interacción táctil en el croquis: selección de asiento libre y modal de reserva", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("heading", { name: /Tolantongo/i }).click();

    // Buscar un botón de asiento disponible usando selector accesible
    const asientoDisponible = page.locator("button[aria-label*='disponible']").first();
    await expect(asientoDisponible).toBeVisible();

    // Tocar el asiento
    await asientoDisponible.click();

    // Verificar que aparece la barra flotante de selección
    const barraFlotante = page.getByText(/asientos seleccionados/i);
    await expect(barraFlotante).toBeVisible();

    // Pulsar botón "Apartar Asientos" por su ID determinista
    const botonApartar = page.locator("#btn-apartar-flotante");
    await expect(botonApartar).toBeVisible();
    await botonApartar.click({ force: true });

    // Verificar que se abre el modal de Nueva Reserva
    await expect(page.getByRole("heading", { name: /Nueva Reserva/i })).toBeVisible();
    await expect(page.getByLabel(/Nombre completo/i)).toBeVisible();
    await expect(page.getByLabel(/Teléfono/i)).toBeVisible();

    // Cerrar modal
    await page.getByRole("button", { name: /Cancelar/i }).click();
    await expect(page.getByRole("heading", { name: /Nueva Reserva/i })).not.toBeVisible();
  });
});
