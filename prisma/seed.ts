import {
  prisma,
  TipoViaje,
  EstadoViaje,
  TipoParada,
  EstadoReservacion,
  EstadoAsiento,
  MetodoPago,
} from "../src/lib/prisma";

function generateSeats(totalAsientos: number) {
  const seats = [];
  const filas = Math.ceil(totalAsientos / 4);
  let seatNumber = 1;

  for (let fila = 1; fila <= filas && seatNumber <= totalAsientos; fila++) {
    const columnas = ["A", "B", "C", "D"];
    for (const columna of columnas) {
      if (seatNumber > totalAsientos) break;
      seats.push({
        numero: seatNumber,
        fila,
        columna,
        estado: EstadoAsiento.DISPONIBLE,
      });
      seatNumber++;
    }
  }
  return seats;
}

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  await prisma.abono.deleteMany();
  await prisma.asiento.deleteMany();
  await prisma.reservacion.deleteMany();
  await prisma.parada.deleteMany();
  await prisma.viaje.deleteMany();

  console.log("🗑️  Datos anteriores eliminados");

  // ============================================
  // VIAJE 1: CORTO - Grutas de Tolantongo (3 días: Viernes a Domingo)
  // ============================================
  const fechaSalidaCorta = new Date("2025-01-17T06:00:00");
  const fechaRegresoCorta = new Date("2025-01-19T22:00:00");

  const viajeCorto = await prisma.viaje.create({
    data: {
      titulo: "Grutas de Tolantongo - Fin de Semana",
      tipo: TipoViaje.CORTO,
      destino: "Grutas de Tolantongo, Hidalgo",
      fechaSalida: fechaSalidaCorta,
      fechaRegreso: fechaRegresoCorta,
      precioBoleto: 1800,
      costoRentaCamion: 28000,
      totalAsientos: 44,
      inclusiones: "Transporte redondo en camioneta de lujo, acceso a grutas y termas, coordinador de grupo",
      estado: EstadoViaje.ACTIVO,
      notas: "Salida viernes 6:00 AM desde Cruz Grande. Regreso domingo 10:00 PM. Llevar traje de baño, toalla y ropa cómoda.",
      paradas: {
        create: [
          {
            orden: 1,
            lugar: "Cruz Grande, Gro. - Punto de encuentro",
            tipo: TipoParada.OTRO,
            descripcion: "Salida 6:00 AM - Presentarse 15 min antes",
            incluyeCosto: false,
          },
          {
            orden: 2,
            lugar: "Grutas de Tolantongo - Entrada principal",
            tipo: TipoParada.GRUTAS,
            descripcion: "Llegada aprox. 12:00 PM - Acceso incluido",
            incluyeCosto: true,
          },
          {
            orden: 3,
            lugar: "Grutas de Tolantongo - Termas y río",
            tipo: TipoParada.BALNEARIO,
            descripcion: "Tiempo libre para disfrutar termas, grutas y río",
            incluyeCosto: true,
          },
          {
            orden: 4,
            lugar: "Comida en restaurante local",
            tipo: TipoParada.COMIDA,
            descripcion: "Comida no incluida - Opciones económicas disponibles",
            incluyeCosto: false,
          },
          {
            orden: 5,
            lugar: "Regreso a Cruz Grande, Gro.",
            tipo: TipoParada.OTRO,
            descripcion: "Llegada estimada 10:00 PM",
            incluyeCosto: false,
          },
        ],
      },
      asientos: {
        create: generateSeats(44).map((s) => ({
          numero: s.numero,
          fila: s.fila,
          columna: s.columna,
          estado: EstadoAsiento.DISPONIBLE,
        })),
      },
    },
  });

  console.log(`✅ Viaje corto creado: ${viajeCorto.titulo} (${viajeCorto.id})`);

  // ============================================
  // VIAJE 2: LARGO - Huasteca Potosina (7 días: Domingo a Domingo)
  // ============================================
  const fechaSalidaLarga = new Date("2025-02-02T05:00:00");
  const fechaRegresoLarga = new Date("2025-02-08T23:00:00");

  const viajeLargo = await prisma.viaje.create({
    data: {
      titulo: "Huasteca Potosina - Aventura 7 Días",
      tipo: TipoViaje.LARGO,
      destino: "Huasteca Potosina, SLP",
      fechaSalida: fechaSalidaLarga,
      fechaRegreso: fechaRegresoLarga,
      precioBoleto: 8500,
      costoRentaCamion: 85000,
      totalAsientos: 47,
      inclusiones:
        "Transporte redondo, 6 noches de hotel (hab. cuádruple), desayunos, acceso a: Cascada de Tamul, Puente de Dios, Xilitla (Las Pozas), Sótano de las Golondrinas, Cascadas de Micos, guías locales, coordinador, seguro de viajero",
      estado: EstadoViaje.ACTIVO,
      notas:
        "Salida domingo 5:00 AM desde Cruz Grande. Incluye hospedaje y desayunos. Comidas y cenas no incluidas (paradas en restaurantes locales). Llevar ropa para agua, repelente, bloqueador, calzado antiderrapante.",
      paradas: {
        create: [
          {
            orden: 1,
            lugar: "Cruz Grande, Gro. - Punto de encuentro",
            tipo: TipoParada.OTRO,
            descripcion: "Salida 5:00 AM - Presentarse 20 min antes",
            incluyeCosto: false,
          },
          {
            orden: 2,
            lugar: "Hotel en Ciudad Valles - Check-in",
            tipo: TipoParada.HOTEL,
            descripcion: "Llegada aprox. 3:00 PM - 6 noches incluidas",
            incluyeCosto: true,
          },
          {
            orden: 3,
            lugar: "Cascada de Tamul - Lancha",
            tipo: TipoParada.TURISTICO,
            descripcion: "Día 2 - Paseo en lancha + rappel opcional (extra)",
            incluyeCosto: true,
          },
          {
            orden: 4,
            lugar: "Puente de Dios - Nado en pozas",
            tipo: TipoParada.BALNEARIO,
            descripcion: "Día 3 - Acceso incluido",
            incluyeCosto: true,
          },
          {
            orden: 5,
            lugar: "Xilitla - Las Pozas de Edward James",
            tipo: TipoParada.TURISTICO,
            descripcion: "Día 4 - Tour guiado incluido",
            incluyeCosto: true,
          },
          {
            orden: 6,
            lugar: "Sótano de las Golondrinas - Avistamiento",
            tipo: TipoParada.TURISTICO,
            descripcion: "Día 5 - Madrugada para ver salida de aves",
            incluyeCosto: true,
          },
          {
            orden: 7,
            lugar: "Cascadas de Micos - Rafting/nado",
            tipo: TipoParada.BALNEARIO,
            descripcion: "Día 6 - Acceso + chaleco salvavidas incluido",
            incluyeCosto: true,
          },
          {
            orden: 8,
            lugar: "Mercado artesanal Ciudad Valles",
            tipo: TipoParada.MERCADO,
            descripcion: "Día 7 - Tiempo libre para compras",
            incluyeCosto: false,
          },
          {
            orden: 9,
            lugar: "Regreso a Cruz Grande, Gro.",
            tipo: TipoParada.OTRO,
            descripcion: "Llegada estimada 11:00 PM",
            incluyeCosto: false,
          },
        ],
      },
      asientos: {
        create: generateSeats(47).map((s) => ({
          numero: s.numero,
          fila: s.fila,
          columna: s.columna,
          estado: EstadoAsiento.DISPONIBLE,
        })),
      },
    },
  });

  console.log(`✅ Viaje largo creado: ${viajeLargo.titulo} (${viajeLargo.id})`);

  // ============================================
  // ASIENTOS Y RESERVACIONES DE PRUEBA - VIAJE CORTO (44 asientos)
  // ============================================
  // Asientos: 1-10 DISPONIBLES, 11-20 APARTADOS, 21-30 PAGADOS, 31-35 BLOQUEADOS, 36-44 DISPONIBLES
  const asientosCorto = await prisma.asiento.findMany({
    where: { viajeId: viajeCorto.id },
    orderBy: { numero: "asc" },
  });

  // Reservación 1: 4 asientos APARTADOS (asientos 11-14) con abonos parciales
  const reservacion1 = await prisma.reservacion.create({
    data: {
      viajeId: viajeCorto.id,
      nombreTitular: "María González López",
      telefono: "7471234567",
      lugarAbordaje: "Cruz Grande - Central de Autobuses",
      totalPagar: 7200, // 4 * 1800
      totalAbonado: 3600,
      saldoPendiente: 3600,
      estado: EstadoReservacion.APARTADO,
      notas: "Familia de 4 - 2 adultos, 2 menores",
      asientos: {
        connect: asientosCorto.slice(10, 14).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [
          { monto: 2000, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-001", notas: "Apartado inicial" },
          { monto: 1600, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-045", notas: "Segundo abono" },
        ],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosCorto.slice(10, 14).map((a) => a.id) } },
    data: { estado: EstadoAsiento.APARTADO, reservacionId: reservacion1.id, nombreOcupante: "María González López" },
  });

  // Reservación 2: 3 asientos PAGADOS (asientos 21-23) - LIQUIDADO
  const reservacion2 = await prisma.reservacion.create({
    data: {
      viajeId: viajeCorto.id,
      nombreTitular: "Carlos Ramírez Pérez",
      telefono: "7479876543",
      lugarAbordaje: "Cruz Grande - Tienda La Esquina",
      totalPagar: 5400, // 3 * 1800
      totalAbonado: 5400,
      saldoPendiente: 0,
      estado: EstadoReservacion.LIQUIDADO,
      notas: "Pago completo - 3 adultos",
      asientos: {
        connect: asientosCorto.slice(20, 23).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [
          { monto: 3000, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-002", notas: "Primer pago" },
          { monto: 2400, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-046", notas: "Liquidación final" },
        ],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosCorto.slice(20, 23).map((a) => a.id) } },
    data: { estado: EstadoAsiento.PAGADO, reservacionId: reservacion2.id, nombreOcupante: "Carlos Ramírez Pérez" },
  });

  // Reservación 3: 2 asientos APARTADOS (asientos 15-16) con un abono
  const reservacion3 = await prisma.reservacion.create({
    data: {
      viajeId: viajeCorto.id,
      nombreTitular: "Ana Patricia Herrera",
      telefono: "7475551234",
      lugarAbordaje: "Cruz Grande - Central de Autobuses",
      totalPagar: 3600, // 2 * 1800
      totalAbonado: 1800,
      saldoPendiente: 1800,
      estado: EstadoReservacion.APARTADO,
      notas: "Pareja - pendiente liquidar",
      asientos: {
        connect: asientosCorto.slice(14, 16).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [{ monto: 1800, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-003", notas: "Apartado 50%" }],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosCorto.slice(14, 16).map((a) => a.id) } },
    data: { estado: EstadoAsiento.APARTADO, reservacionId: reservacion3.id, nombreOcupante: "Ana Patricia Herrera" },
  });

  // Bloquear asientos 31-35 (mantenimiento/chofer)
  await prisma.asiento.updateMany({
    where: { id: { in: asientosCorto.slice(30, 35).map((a) => a.id) } },
    data: { estado: EstadoAsiento.BLOQUEADO, nombreOcupante: "Staff/Chofer" },
  });

  console.log("✅ Reservaciones viaje corto creadas (3 reservaciones, 9 asientos ocupados)");

  // ============================================
  // ASIENTOS Y RESERVACIONES DE PRUEBA - VIAJE LARGO (47 asientos)
  // ============================================
  const asientosLargo = await prisma.asiento.findMany({
    where: { viajeId: viajeLargo.id },
    orderBy: { numero: "asc" },
  });

  // Reservación 4: 4 asientos PAGADOS (asientos 1-4) - LIQUIDADO (primeros en apartar)
  const reservacion4 = await prisma.reservacion.create({
    data: {
      viajeId: viajeLargo.id,
      nombreTitular: "Roberto Martínez Díaz",
      telefono: "7471112233",
      lugarAbordaje: "Cruz Grande - Central de Autobuses",
      totalPagar: 34000, // 4 * 8500
      totalAbonado: 34000,
      saldoPendiente: 0,
      estado: EstadoReservacion.LIQUIDADO,
      notas: "Familia - pago completo anticipado",
      asientos: {
        connect: asientosLargo.slice(0, 4).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [
          { monto: 10000, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-001", notas: "Apartado inicial" },
          { monto: 12000, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-002", notas: "Segundo pago" },
          { monto: 12000, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-010", notas: "Liquidación final" },
        ],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosLargo.slice(0, 4).map((a) => a.id) } },
    data: { estado: EstadoAsiento.PAGADO, reservacionId: reservacion4.id, nombreOcupante: "Roberto Martínez Díaz" },
  });

  // Reservación 5: 3 asientos APARTADOS (asientos 5-7) con abonos
  const reservacion5 = await prisma.reservacion.create({
    data: {
      viajeId: viajeLargo.id,
      nombreTitular: "Lucía Fernández Gómez",
      telefono: "7474445566",
      lugarAbordaje: "Cruz Grande - Tienda La Esquina",
      totalPagar: 25500, // 3 * 8500
      totalAbonado: 12000,
      saldoPendiente: 13500,
      estado: EstadoReservacion.APARTADO,
      notas: "3 amigas - plan de pagos quincenales",
      asientos: {
        connect: asientosLargo.slice(4, 7).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [
          { monto: 5000, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-011", notas: "Apartado" },
          { monto: 7000, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-003", notas: "Primera quincena" },
        ],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosLargo.slice(4, 7).map((a) => a.id) } },
    data: { estado: EstadoAsiento.APARTADO, reservacionId: reservacion5.id, nombreOcupante: "Lucía Fernández Gómez" },
  });

  // Reservación 6: 2 asientos PAGADOS (asientos 8-9) - LIQUIDADO
  const reservacion6 = await prisma.reservacion.create({
    data: {
      viajeId: viajeLargo.id,
      nombreTitular: "Jorge Luis Sánchez",
      telefono: "7477778899",
      lugarAbordaje: "Cruz Grande - Central de Autobuses",
      totalPagar: 17000, // 2 * 8500
      totalAbonado: 17000,
      saldoPendiente: 0,
      estado: EstadoReservacion.LIQUIDADO,
      notas: "Pareja - liquidado",
      asientos: {
        connect: asientosLargo.slice(7, 9).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [
          { monto: 8500, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-004", notas: "50% anticipo" },
          { monto: 8500, metodo: MetodoPago.TRANSFERENCIA, comprobanteRef: "TRF-005", notas: "Liquidación" },
        ],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosLargo.slice(7, 9).map((a) => a.id) } },
    data: { estado: EstadoAsiento.PAGADO, reservacionId: reservacion6.id, nombreOcupante: "Jorge Luis Sánchez" },
  });

  // Reservación 7: 2 asientos APARTADOS (asientos 10-11) - solo apartado inicial
  const reservacion7 = await prisma.reservacion.create({
    data: {
      viajeId: viajeLargo.id,
      nombreTitular: "Carmen Rosa Vargas",
      telefono: "7473334455",
      lugarAbordaje: "Cruz Grande - Tienda La Esquina",
      totalPagar: 17000, // 2 * 8500
      totalAbonado: 4000,
      saldoPendiente: 13000,
      estado: EstadoReservacion.APARTADO,
      notas: "Madre e hija - apartado inicial",
      asientos: {
        connect: asientosLargo.slice(9, 11).map((a) => ({ id: a.id })),
      },
      abonos: {
        create: [{ monto: 4000, metodo: MetodoPago.EFECTIVO, comprobanteRef: "EFE-012", notas: "Apartado inicial" }],
      },
    },
  });

  await prisma.asiento.updateMany({
    where: { id: { in: asientosLargo.slice(9, 11).map((a) => a.id) } },
    data: { estado: EstadoAsiento.APARTADO, reservacionId: reservacion7.id, nombreOcupante: "Carmen Rosa Vargas" },
  });

  // Bloquear asientos 46-47 (staff)
  await prisma.asiento.updateMany({
    where: { id: { in: asientosLargo.slice(45, 47).map((a) => a.id) } },
    data: { estado: EstadoAsiento.BLOQUEADO, nombreOcupante: "Coordinador/Chofer" },
  });

  console.log("✅ Reservaciones viaje largo creadas (4 reservaciones, 11 asientos ocupados)");

  // ============================================
  // RESUMEN FINAL
  // ============================================
  const stats = await Promise.all([
    prisma.viaje.count(),
    prisma.parada.count(),
    prisma.reservacion.count(),
    prisma.asiento.count(),
    prisma.abono.count(),
    prisma.asiento.groupBy({ by: ["estado"], _count: true }),
    prisma.reservacion.groupBy({ by: ["estado"], _count: true }),
  ]);

  console.log("\n📊 RESUMEN DE SEED:");
  console.log(`   Viajes: ${stats[0]}`);
  console.log(`   Paradas: ${stats[1]}`);
  console.log(`   Reservaciones: ${stats[2]}`);
  console.log(`   Asientos totales: ${stats[3]}`);
  console.log(`   Abonos: ${stats[4]}`);
  console.log("\n   Asientos por estado:");
  stats[5].forEach((s) => console.log(`     ${s.estado}: ${s._count}`));
  console.log("\n   Reservaciones por estado:");
  stats[6].forEach((s) => console.log(`     ${s.estado}: ${s._count}`));

  console.log("\n✅ Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });