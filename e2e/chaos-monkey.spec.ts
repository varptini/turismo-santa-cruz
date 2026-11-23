import { test, expect } from "@playwright/test";

test.describe("Chaos & Monkey Testing — Usuario Ingenuo / Destructivo", () => {
  test("Resistencia a clics rápidos, cambio violento de pestañas y sin excepciones no capturadas", async ({ page }) => {
    const uncaughtErrors: string[] = [];
    page.on("pageerror", (err) => {
      uncaughtErrors.push(err.message);
    });

    await page.goto("/");
    await page.getByRole("heading", { name: /Tolantongo/i }).click();
    await expect(page.locator("#tab-croquis")).toBeVisible();

    // 1. Alternancia de pestañas
    const pestañas = [
      page.locator("#tab-croquis"),
      page.locator("#tab-reservas"),
      page.locator("#tab-itinerario"),
      page.locator("#tab-abordaje"),
    ];

    for (let i = 0; i < 2; i++) {
      for (const pestaña of pestañas) {
        await pestaña.scrollIntoViewIfNeeded();
        await pestaña.click();
        await page.waitForTimeout(100);
      }
    }

    // Volver a Croquis
    await pestañas[0].click();

    // 2. Clics caóticos en asientos
    const todosLosAsientos = page.locator("button[aria-label*='Asiento']");
    const count = await todosLosAsientos.count();
    expect(count).toBeGreaterThan(10);

    for (let i = 0; i < Math.min(5, count); i++) {
      await todosLosAsientos.nth(i).click({ force: true });
    }

    // 3. Verificación de que la UI sigue en pie
    const header = page.getByRole("heading", { name: /Tolantongo/i });
    await expect(header).toBeVisible();

    // 4. Cero excepciones críticas no capturadas
    expect(uncaughtErrors).toEqual([]);
  });

  test("Formulario de reserva: resistencia a datos destructivos y valores límite", async ({ page }) => {
    const uncaughtErrors: string[] = [];
    page.on("pageerror", (err) => {
      uncaughtErrors.push(err.message);
    });

    await page.goto("/");
    await page.getByRole("heading", { name: /Tolantongo/i }).click();
    await expect(page.locator("#tab-croquis")).toBeVisible();

    // Seleccionar un asiento libre
    const asientoDisponible = page.locator("button[aria-label*='disponible']").first();
    await expect(asientoDisponible).toBeVisible();
    await asientoDisponible.click();

    const botonApartar = page.locator("#btn-apartar-flotante");
    await expect(botonApartar).toBeVisible();
    await botonApartar.click({ force: true });

    // El modal de nueva reserva debe estar visible
    await expect(page.getByRole("heading", { name: /Nueva Reserva/i })).toBeVisible();

    const inputNombre = page.getByLabel(/Nombre completo/i);
    const inputTelefono = page.getByLabel(/Teléfono/i);
    const inputAnticipo = page.getByLabel(/Pago inicial/i);
    const botonConfirmar = page.getByRole("button", { name: /Crear Reserva/i });

    // Caso A: Intentar enviar vacío
    await botonConfirmar.click();
    await expect(page.getByRole("heading", { name: /Nueva Reserva/i })).toBeVisible();

    // Caso B: Inyección de caracteres raros, scripts y cadenas enormes
    const textoAbsurdo = "<script>alert('xss')</script> " + "A".repeat(100);
    await inputNombre.fill(textoAbsurdo);
    await inputTelefono.fill("abcdef12345");
    await inputAnticipo.fill("-99999");

    // Intentar confirmar
    await botonConfirmar.click();

    // El sistema debe tolerar la entrada sin crashear el renderizado
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Cancelar para limpiar estado
    await page.getByRole("button", { name: /Cancelar/i }).click();
    await expect(page.getByRole("heading", { name: /Nueva Reserva/i })).not.toBeVisible();

    // Cero excepciones no capturadas
    expect(uncaughtErrors).toEqual([]);
  });

  test("Modo Abordaje: estabilidad ante filtros y búsquedas con caracteres especiales", async ({ page }) => {
    const uncaughtErrors: string[] = [];
    page.on("pageerror", (err) => {
      uncaughtErrors.push(err.message);
    });

    await page.goto("/");
    await page.getByRole("heading", { name: /Tolantongo/i }).click();
    await expect(page.locator("#tab-croquis")).toBeVisible();

    // Cambiar a la pestaña de Abordaje por su ID
    await page.locator("#tab-abordaje").click();

    // Probar buscador con caracteres especiales usando placeholder exacto
    const buscador = page.getByPlaceholder(/Buscar por asiento/i);
    await expect(buscador).toBeVisible();

    await buscador.fill("%%%$$$###'''\"\"\"///\\\\\\");
    await expect(page.getByText(/No hay pasajeros que coincidan/i)).toBeVisible();

    await buscador.fill(""); // Limpiar

    // Probar botones de filtro
    const filtros = ["Todos", "Por Abordar", "Abordados", "Con Saldo"];
    for (const f of filtros) {
      const botonFiltro = page.getByRole("button", { name: new RegExp(f, "i") });
      if (await botonFiltro.isVisible()) {
        await botonFiltro.click();
      }
    }

    // Verificar que la lista de abordaje sigue funcionando
    await expect(page.getByRole("button", { name: /Todos/i })).toBeVisible();

    expect(uncaughtErrors).toEqual([]);
  });
});
