import { deleteParada } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteParada(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting parada:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar parada" },
      { status: 400 }
    );
  }
}