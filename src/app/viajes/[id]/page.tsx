import { getViajeById } from "@/actions/viajes";
import ViajeDetalleClient from "./ViajeDetalleClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ViajeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viajeRaw = await getViajeById(id);

  if (!viajeRaw) {
    notFound();
  }

  const initialViaje = JSON.parse(JSON.stringify(viajeRaw));

  return <ViajeDetalleClient initialViaje={initialViaje} />;
}
