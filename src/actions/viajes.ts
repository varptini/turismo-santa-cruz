"use server";

import { prisma } from "@/lib/prisma";
import {
  TipoViaje,
  EstadoViaje,
  EstadoReservacion,
  EstadoAsiento,
  MetodoPago,
  Prisma,
} from "@/generated/prisma/client";

// Tipos para los datos de entrada
export interface CreateViajeData {
  titulo: string;
  tipo: TipoViaje;
  destino: string;
  fechaSalida: string;
  fechaRegreso: string;
  precioBoleto: number;
  costoRentaCamion: number;
  totalAsientos: number;
  inclusiones?: string;
  notas?: string;
}

export interface CreateReservacionData {
  viajeId: string;
  nombreTitular: string;
  telefono: string;
  lugarAbordaje?: string;
  asientosIds: string[];
  anticipo?: number;
  notas?: string;
}

export interface AddAbonoData {
  reservacionId: string;
  monto: number;
  metodo: MetodoPago;
  comprobanteRef?: string;
  notas?: string;
}

export interface AddParadaData {
  viajeId: string;
  orden: number;
  lugar: string;
  tipo: "TURISTICO" | "BALNEARIO" | "GRUTAS" | "MERCADO" | "HOTEL" | "COMIDA" | "OTRO";
  descripcion?: string;
  incluyeCosto?: boolean;
}

// ============================================
// VIAJES
// ============================================

export async function getViajes() {
  const viajes = await prisma.viaje.findMany({
    where: {
      estado: { in: [EstadoViaje.ACTIVO, EstadoViaje.EN_CURSO] },
    },
    include: {
      _count: {
        select: {
          asientos: true,
          reservaciones: true,
        },
      },
      asientos: {
        select: { id: true, estado: true },
      },
      reservaciones: {
        where: { estado: { not: EstadoReservacion.CANCELADO } },
        select: { totalAbonado: true },
      },
    },
    orderBy: { fechaSalida: "asc" },
  });

  return viajes.map((viaje) => {
    const asientosOcupados = viaje.asientos.filter(
      (a) => a.estado === EstadoAsiento.APARTADO || a.estado === EstadoAsiento.PAGADO
    ).length;
    const asientosBloqueados = viaje.asientos.filter(
      (a) => a.estado === EstadoAsiento.BLOQUEADO
    ).length;
    const asientosVendibles = viaje.totalAsientos - asientosBloqueados;
    const asientosLibres = Math.max(0, asientosVendibles - asientosOcupados);
    const totalRecaudado = viaje.reservaciones.reduce((sum, r) => sum + r.totalAbonado, 0);
    const ganancia = totalRecaudado - viaje.costoRentaCamion;

    return {
      ...viaje,
      asientosOcupados,
      asientosLibres,
      totalRecaudado,
      ganancia,
      porcentajeOcupacion: asientosVendibles > 0 ? (asientosOcupados / asientosVendibles) * 100 : 0,
    };
  });
}

export async function getViajeById(id: string) {
  const viaje = await prisma.viaje.findUnique({
    where: { id },
    include: {
      paradas: {
        orderBy: { orden: "asc" },
      },
      asientos: {
        orderBy: { numero: "asc" },
        include: {
          reservacion: {
            select: {
              id: true,
              nombreTitular: true,
              telefono: true,
              lugarAbordaje: true,
              totalPagar: true,
              estado: true,
              totalAbonado: true,
              saldoPendiente: true,
            },
          },
        },
      },
      reservaciones: {
        where: { estado: { not: EstadoReservacion.CANCELADO } },
        include: {
          asientos: {
            orderBy: { numero: "asc" },
            select: { id: true, numero: true, estado: true },
          },
          abonos: {
            orderBy: { fecha: "desc" },
            select: {
              id: true,
              monto: true,
              fecha: true,
              metodo: true,
              comprobanteRef: true,
              notas: true,
            },
          },
        },
        orderBy: { fechaReserva: "desc" },
      },
    },
  });

  return viaje;
}

export async function createViaje(data: CreateViajeData) {
  const fechaSalida = new Date(data.fechaSalida);
  const fechaRegreso = new Date(data.fechaRegreso);

  // Validar que la fecha de regreso sea posterior a la de salida
  if (fechaRegreso <= fechaSalida) {
    throw new Error("La fecha de regreso debe ser posterior a la fecha de salida");
  }

  // Validar capacidad
  const capacidadesValidas = [40, 44, 47, 50];
  if (!capacidadesValidas.includes(data.totalAsientos)) {
    throw new Error("Capacidad de autobús no válida. Opciones: 40, 44, 47, 50 asientos");
  }

  const viaje = await prisma.viaje.create({
    data: {
      titulo: data.titulo,
      tipo: data.tipo,
      destino: data.destino,
      fechaSalida,
      fechaRegreso,
      precioBoleto: data.precioBoleto,
      costoRentaCamion: data.costoRentaCamion,
      totalAsientos: data.totalAsientos,
      inclusiones: data.inclusiones,
      notas: data.notas,
    },
  });

  // Generar asientos automáticamente
  await generarAsientos(viaje.id, data.totalAsientos);

  return viaje;
}

async function generarAsientos(viajeId: string, totalAsientos: number) {
  // Configuración: 4 columnas (1,2 | pasillo | 3,4)
  // Columna 1: Ventana Izquierda
  // Columna 2: Pasillo Izquierdo
  // Columna 3: Pasillo Derecho
  // Columna 4: Ventana Derecha

  const asientosData: Prisma.AsientoCreateManyInput[] = [];
  let numero = 1;

  // Calcular número de filas necesarias
  const asientosPorFila = 4;
  const totalFilas = Math.ceil(totalAsientos / asientosPorFila);

  for (let fila = 1; fila <= totalFilas; fila++) {
    for (let col = 1; col <= asientosPorFila; col++) {
      if (numero > totalAsientos) break;

      let columna: string;
      let estado: EstadoAsiento = EstadoAsiento.DISPONIBLE;
      let nombreOcupante: string | undefined;

      // Asignar columna según posición
      switch (col) {
        case 1:
          columna = "VENTANA_IZQ";
          break;
        case 2:
          columna = "PASILLO_IZQ";
          break;
        case 3:
          columna = "PASILLO_DER";
          break;
        case 4:
          columna = "VENTANA_DER";
          break;
        default:
          columna = "VENTANA_IZQ";
      }

      // Bloquear primeros asientos para chofer/coordinador
      // Asiento 1: Chofer (siempre bloqueado)
      // Asiento 2: Coordinador (bloqueado si hay más de 40 asientos)
      if (numero === 1) {
        estado = EstadoAsiento.BLOQUEADO;
        nombreOcupante = "Chofer";
      } else if (numero === 2 && totalAsientos > 40) {
        estado = EstadoAsiento.BLOQUEADO;
        nombreOcupante = "Coordinador";
      }

      asientosData.push({
        viajeId,
        numero,
        fila,
        columna,
        estado,
        nombreOcupante,
      });

      numero++;
    }
  }

  await prisma.asiento.createMany({
    data: asientosData,
  });
}

// ============================================
// RESERVACIONES
// ============================================

export async function createReservacion(data: CreateReservacionData) {
  if (!data.asientosIds || data.asientosIds.length === 0) {
    throw new Error("Debe seleccionar al menos un asiento");
  }

  const viaje = await prisma.viaje.findUnique({
    where: { id: data.viajeId },
    select: { precioBoleto: true, totalAsientos: true },
  });

  if (!viaje) {
    throw new Error("Viaje no encontrado");
  }

  // Verificar que los asientos estén disponibles
  const asientos = await prisma.asiento.findMany({
    where: {
      id: { in: data.asientosIds },
      viajeId: data.viajeId,
      estado: EstadoAsiento.DISPONIBLE,
    },
  });

  if (asientos.length !== data.asientosIds.length) {
    throw new Error("Algunos asientos ya no están disponibles");
  }

  const totalPagar = Number((data.asientosIds.length * viaje.precioBoleto).toFixed(2));
  const anticipo = Math.max(0, Number((data.anticipo || 0).toFixed(2)));

  if (anticipo > totalPagar) {
    throw new Error("El anticipo no puede ser mayor al total a pagar");
  }

  const saldoPendiente = Math.max(0, Number((totalPagar - anticipo).toFixed(2)));

  let estadoReservacion: EstadoReservacion = EstadoReservacion.APARTADO;
  let estadoAsientos: EstadoAsiento = EstadoAsiento.APARTADO;

  if (saldoPendiente <= 0) {
    estadoReservacion = EstadoReservacion.LIQUIDADO;
    estadoAsientos = EstadoAsiento.PAGADO;
  }

  const reservacion = await prisma.$transaction(async (tx) => {
    // Crear reservación
    const nuevaReservacion = await tx.reservacion.create({
      data: {
        viajeId: data.viajeId,
        nombreTitular: data.nombreTitular.trim(),
        telefono: data.telefono.trim(),
        lugarAbordaje: data.lugarAbordaje?.trim() || "Cruz Grande, Gro.",
        totalPagar,
        totalAbonado: anticipo,
        saldoPendiente,
        estado: estadoReservacion,
        notas: data.notas?.trim() || undefined,
      },
    });

    // Actualizar asientos
    await tx.asiento.updateMany({
      where: { id: { in: data.asientosIds } },
      data: {
        estado: estadoAsientos,
        reservacionId: nuevaReservacion.id,
        nombreOcupante: data.nombreTitular.trim(),
      },
    });

    // Crear abono inicial si hay anticipo
    if (anticipo > 0) {
      await tx.abono.create({
        data: {
          reservacionId: nuevaReservacion.id,
          monto: anticipo,
          metodo: MetodoPago.EFECTIVO,
          notas: "Anticipo inicial",
        },
      });
    }

    return nuevaReservacion;
  });

  return reservacion;
}

export async function cancelReservacion(reservacionId: string) {
  await prisma.$transaction(async (tx) => {
    // Obtener la reservación con sus asientos
    const reservacion = await tx.reservacion.findUnique({
      where: { id: reservacionId },
      include: { asientos: true },
    });

    if (!reservacion) {
      throw new Error("Reservación no encontrada");
    }

    // Liberar asientos
    await tx.asiento.updateMany({
      where: { reservacionId },
      data: {
        estado: EstadoAsiento.DISPONIBLE,
        reservacionId: null,
        nombreOcupante: null,
      },
    });

    // Eliminar abonos asociados
    await tx.abono.deleteMany({
      where: { reservacionId },
    });

    // Eliminar reservación
    await tx.reservacion.delete({
      where: { id: reservacionId },
    });
  });

  return { success: true };
}

// ============================================
// ABONOS
// ============================================

export async function addAbono(data: AddAbonoData) {
  if (data.monto <= 0) {
    throw new Error("El monto del abono debe ser mayor a 0");
  }

  const reservacion = await prisma.reservacion.findUnique({
    where: { id: data.reservacionId },
    include: { asientos: true },
  });

  if (!reservacion) {
    throw new Error("Reservación no encontrada");
  }

  if (reservacion.estado === EstadoReservacion.CANCELADO) {
    throw new Error("No se pueden agregar abonos a una reservación cancelada");
  }

  if (data.monto > reservacion.saldoPendiente + 0.01) {
    throw new Error(`El abono no puede exceder el saldo pendiente ($${reservacion.saldoPendiente.toFixed(2)})`);
  }

  const montoAbono = Number(data.monto.toFixed(2));
  const nuevoTotalAbonado = Number((reservacion.totalAbonado + montoAbono).toFixed(2));
  const nuevoSaldoPendiente = Math.max(0, Number((reservacion.totalPagar - nuevoTotalAbonado).toFixed(2)));

  let nuevoEstadoReservacion = reservacion.estado;
  let nuevoEstadoAsientos = reservacion.asientos[0]?.estado || EstadoAsiento.APARTADO;

  if (nuevoSaldoPendiente <= 0.009) {
    nuevoEstadoReservacion = EstadoReservacion.LIQUIDADO;
    nuevoEstadoAsientos = EstadoAsiento.PAGADO;
  }

  await prisma.$transaction(async (tx) => {
    // Crear abono
    await tx.abono.create({
      data: {
        reservacionId: data.reservacionId,
        monto: montoAbono,
        metodo: data.metodo,
        comprobanteRef: data.comprobanteRef?.trim() || undefined,
        notas: data.notas?.trim() || undefined,
      },
    });

    // Actualizar reservación
    await tx.reservacion.update({
      where: { id: data.reservacionId },
      data: {
        totalAbonado: nuevoTotalAbonado,
        saldoPendiente: nuevoSaldoPendiente,
        estado: nuevoEstadoReservacion,
      },
    });

    // Actualizar asientos si se liquidó
    if (nuevoEstadoReservacion === EstadoReservacion.LIQUIDADO) {
      await tx.asiento.updateMany({
        where: { reservacionId: data.reservacionId },
        data: { estado: EstadoAsiento.PAGADO },
      });
    }
  });

  return { success: true };
}

// ============================================
// PARADAS
// ============================================

export async function addParada(data: AddParadaData) {
  // Verificar si ya existe una parada con el mismo orden en este viaje
  const existeOrden = await prisma.parada.findUnique({
    where: {
      viajeId_orden: {
        viajeId: data.viajeId,
        orden: data.orden,
      },
    },
  });

  if (existeOrden) {
    throw new Error(`Ya existe una parada con el número de orden ${data.orden}. Selecciona otro orden.`);
  }

  const parada = await prisma.parada.create({
    data: {
      viajeId: data.viajeId,
      orden: data.orden,
      lugar: data.lugar.trim(),
      tipo: data.tipo,
      descripcion: data.descripcion?.trim() || undefined,
      incluyeCosto: data.incluyeCosto || false,
    },
  });

  return parada;
}

export async function deleteParada(paradaId: string) {
  await prisma.parada.delete({
    where: { id: paradaId },
  });

  return { success: true };
}

// ============================================
// UTILIDADES
// ============================================

export async function getAsientosDisponibles(viajeId: string) {
  return prisma.asiento.findMany({
    where: {
      viajeId,
      estado: EstadoAsiento.DISPONIBLE,
    },
    orderBy: { numero: "asc" },
    select: {
      id: true,
      numero: true,
      fila: true,
      columna: true,
    },
  });
}

export async function getReservacionWithDetails(reservacionId: string) {
  return prisma.reservacion.findUnique({
    where: { id: reservacionId },
    include: {
      viaje: {
        select: {
          id: true,
          titulo: true,
          destino: true,
          fechaSalida: true,
          precioBoleto: true,
        },
      },
      asientos: {
        orderBy: { numero: "asc" },
        select: { id: true, numero: true, estado: true },
      },
      abonos: {
        orderBy: { fecha: "desc" },
        select: {
          id: true,
          monto: true,
          fecha: true,
          metodo: true,
          comprobanteRef: true,
          notas: true,
        },
      },
    },
  });
}