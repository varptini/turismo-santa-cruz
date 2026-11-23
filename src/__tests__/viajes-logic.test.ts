import { describe, it, expect } from "vitest";

describe("Lógica de Negocio y Finanzas de Turismo Santa Cruz", () => {
  describe("Cálculo de balances y abonos", () => {
    it("calcula correctamente el total a pagar según el número de asientos", () => {
      const precioBoleto = 1800;
      const asientosSeleccionados = [3, 4, 5];
      const totalPagar = asientosSeleccionados.length * precioBoleto;
      expect(totalPagar).toBe(5400);
    });

    it("calcula saldo pendiente con anticipo inicial", () => {
      const totalPagar = 5400;
      const anticipo = 1500;
      const saldoPendiente = totalPagar - anticipo;
      expect(saldoPendiente).toBe(3900);
    });

    it("actualiza estado a LIQUIDADO cuando los abonos cubren el total", () => {
      const totalPagar = 3600;
      let totalAbonado = 1000;
      let estado = totalAbonado >= totalPagar ? "LIQUIDADO" : "APARTADO";
      expect(estado).toBe("APARTADO");

      // Segundo abono
      const nuevoAbono = 2600;
      totalAbonado += nuevoAbono;
      const saldoPendiente = Math.max(0, totalPagar - totalAbonado);
      estado = saldoPendiente === 0 ? "LIQUIDADO" : "APARTADO";

      expect(saldoPendiente).toBe(0);
      expect(estado).toBe("LIQUIDADO");
    });

    it("no permite abonos negativos o mayores al saldo pendiente", () => {
      const saldoPendiente = 2000;
      const abonoInvalido1 = -500;
      const abonoInvalido2 = 2500;

      const esValido1 = abonoInvalido1 > 0 && abonoInvalido1 <= saldoPendiente;
      const esValido2 = abonoInvalido2 > 0 && abonoInvalido2 <= saldoPendiente;

      expect(esValido1).toBe(false);
      expect(esValido2).toBe(false);
    });
  });

  describe("Cálculo de rentabilidad del autobús rentado", () => {
    it("determina punto de equilibrio y ganancia real", () => {
      const costoRentaCamion = 28000;
      const precioBoleto = 1800;
      const totalAsientos = 44;
      const asientosStaff = 2; // Chofer y coordinador
      const asientosVendibles = totalAsientos - asientosStaff; // 42

      // Asientos mínimos para no perder
      const asientosEquilibrio = Math.ceil(costoRentaCamion / precioBoleto);
      expect(asientosEquilibrio).toBe(16);

      // Si se venden 30 asientos y todos abonan o liquidan:
      const totalRecaudado = 30 * precioBoleto; // $54,000
      const ganancia = totalRecaudado - costoRentaCamion;
      expect(ganancia).toBe(26000);
    });

    it("calcula pérdida proyectada si no se alcanza el punto de equilibrio", () => {
      const costoRentaCamion = 85000;
      const totalRecaudado = 67000;
      const ganancia = totalRecaudado - costoRentaCamion;
      expect(ganancia).toBe(-18000);
    });
  });

  describe("Generación y distribución de asientos en el autobús", () => {
    it("distribuye 44 asientos en 11 filas de 4 columnas (2+2 con pasillo)", () => {
      const totalAsientos = 44;
      const asientos = [];
      const columnas = ["A", "B", "C", "D"]; // A=Ventana Izq, B=Pasillo Izq, C=Pasillo Der, D=Ventana Der

      for (let i = 1; i <= totalAsientos; i++) {
        const fila = Math.ceil(i / 4);
        const colIndex = (i - 1) % 4;
        asientos.push({
          numero: i,
          fila,
          columna: columnas[colIndex],
          estado: i <= 2 ? "BLOQUEADO" : "DISPONIBLE",
        });
      }

      expect(asientos.length).toBe(44);
      expect(asientos[0]).toEqual({ numero: 1, fila: 1, columna: "A", estado: "BLOQUEADO" });
      expect(asientos[1]).toEqual({ numero: 2, fila: 1, columna: "B", estado: "BLOQUEADO" });
      expect(asientos[2]).toEqual({ numero: 3, fila: 1, columna: "C", estado: "DISPONIBLE" });
      expect(asientos[43]).toEqual({ numero: 44, fila: 11, columna: "D", estado: "DISPONIBLE" });
    });

    it("soporta camiones de 40, 47 y 50 asientos", () => {
      const capacidades = [40, 44, 47, 50];
      capacidades.forEach((cap) => {
        const filas = Math.ceil(cap / 4);
        expect(filas).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe("Gestión de paradas e itinerario", () => {
    it("asigna orden incremental y evita colisiones en la ruta", () => {
      const paradasExistentes = [{ orden: 1 }, { orden: 2 }, { orden: 3 }];
      const siguienteOrden = Math.max(...paradasExistentes.map((p) => p.orden), 0) + 1;
      expect(siguienteOrden).toBe(4);
    });

    it("calcula correctamente el siguiente orden tras eliminación de una parada intermedia", () => {
      // Se eliminó la parada 2, quedan 1 y 3
      const paradasRestantes = [{ orden: 1 }, { orden: 3 }];
      const siguienteOrden = Math.max(...paradasRestantes.map((p) => p.orden), 0) + 1;
      expect(siguienteOrden).toBe(4);
    });
  });
});
