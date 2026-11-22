import { addParada } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parada = await addParada({ ...body, viajeId: id });
    return NextResponse.json(parada, { status: 201 });
  } catch (error) {
    console.error("Error adding parada:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al agregar parada" },
      { status: 400 }
    );
  }
}