import { Suspense } from "react";
import ViajeDetalleClient from "./ViajeDetalleClient";

export default function ViajeDetallePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" /></div>}>
      <ViajeDetalleClient params={params} />
    </Suspense>
  );
}