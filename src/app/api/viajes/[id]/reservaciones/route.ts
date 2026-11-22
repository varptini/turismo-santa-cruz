import { createReservacion } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const reservacion = await createReservacion({ ...body, viajeId: id });
    return NextResponse.json(reservacion, { status: 201 });
  } catch (error) {
    console.error("Error creating reservacion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear reserva" },
      { status: 400 }
    );
  }
}