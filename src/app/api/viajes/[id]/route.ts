import { getViajeById } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viaje = await getViajeById(id);
    if (!viaje) {
      return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
    }
    return NextResponse.json(viaje);
  } catch (error) {
    console.error("Error fetching viaje:", error);
    return NextResponse.json({ error: "Error al obtener viaje" }, { status: 500 });
  }
}