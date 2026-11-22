import { getViajes, createViaje } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const viajes = await getViajes();
    return NextResponse.json(viajes);
  } catch (error) {
    console.error("Error fetching viajes:", error);
    return NextResponse.json({ error: "Error al obtener viajes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const viaje = await createViaje(body);
    return NextResponse.json(viaje, { status: 201 });
  } catch (error) {
    console.error("Error creating viaje:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear viaje" },
      { status: 400 }
    );
  }
}