import { prisma } from "@/lib/prisma";
import { EstadoAsiento, EstadoReservacion, MetodoPago } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asiento = await prisma.asiento.findUnique({
      where: { id },
      include: { reservacion: true },
    });

    if (!asiento) {
      return NextResponse.json({ error: "Asiento no encontrado" }, { status: 404 });
    }

    if (!asiento.reservacionId || !asiento.reservacion) {
      return NextResponse.json({ error: "Asiento sin reservación asociada" }, { status: 400 });
    }

    const reservacionId = asiento.reservacionId;
    const reservacion = asiento.reservacion;

    await prisma.$transaction(async (tx) => {
      // Marcar asiento como abordado (PAGADO)
      await tx.asiento.update({
        where: { id },
        data: { estado: EstadoAsiento.PAGADO },
      });

      // Si la reservación estaba en APARTADO, verificar si todos los asientos ya están en PAGADO
      const asientosReservacion = await tx.asiento.findMany({
        where: { reservacionId },
      });

      const todosPagados = asientosReservacion.every((a) => a.estado === EstadoAsiento.PAGADO);
      if (todosPagados && reservacion.estado === EstadoReservacion.APARTADO) {
        const saldoRestante = reservacion.saldoPendiente;

        // Registrar abono si había saldo pendiente liquidado al abordar
        if (saldoRestante > 0) {
          await tx.abono.create({
            data: {
              reservacionId,
              monto: saldoRestante,
              metodo: MetodoPago.EFECTIVO,
              notas: "Cobro liquidado al abordar el autobús",
            },
          });
        }

        await tx.reservacion.update({
          where: { id: reservacionId },
          data: {
            estado: EstadoReservacion.LIQUIDADO,
            totalAbonado: reservacion.totalPagar,
            saldoPendiente: 0,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en check-in:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error en check-in" },
      { status: 500 }
    );
  }
}