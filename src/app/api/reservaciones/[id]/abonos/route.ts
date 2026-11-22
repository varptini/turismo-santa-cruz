import { addAbono } from "@/actions/viajes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await addAbono({ ...body, reservacionId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding abono:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al registrar abono" },
      { status: 400 }
    );
  }
}