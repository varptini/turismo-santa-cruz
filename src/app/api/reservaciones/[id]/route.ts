import { cancelReservacion } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await cancelReservacion(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling reservacion:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cancelar reserva" },
      { status: 400 }
    );
  }
}