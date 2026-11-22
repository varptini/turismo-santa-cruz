"use client";

import { useState, useEffect, useCallback } from "react";
import { Bus, Users, MapPin, ClipboardCheck, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import CroquisAutobus from "@/components/CroquisAutobus";
import ModalDetalleAsiento from "@/components/ModalDetalleAsiento";
import ModalNuevaReserva from "@/components/ModalNuevaReserva";
import ModalAbono from "@/components/ModalAbono";
import ItinerarioView, { Parada } from "@/components/ItinerarioView";
import ModoAbordaje, { AsientoAbordaje } from "@/components/ModoAbordaje";
import { formatWhatsAppPhone } from "@/lib/whatsapp";

type Tab = "croquis" | "reservas" | "itinerario" | "abordaje";

interface ViajeDetalleClientProps {
  params: Promise<{ id: string }>;
}

interface ViajeDetalle {
  id: string;
  titulo: string;
  tipo: "CORTO" | "LARGO";
  destino: string;
  fechaSalida: string;
  fechaRegreso: string;
  precioBoleto: number;
  costoRentaCamion: number;
  totalAsientos: number;
  inclusiones?: string | null;
  estado: "ACTIVO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";
  paradas: Parada[];
  asientos: Array<{
    id: string;
    numero: number;
    fila: number;
    columna: string;
    estado: "DISPONIBLE" | "APARTADO" | "PAGADO" | "BLOQUEADO";
    reservacionId?: string | null;
    nombreOcupante?: string | null;
    reservacion?: {
      id: string;
      nombreTitular: string;
      telefono: string;
      estado: string;
      totalAbonado: number;
      saldoPendiente: number;
    } | null;
  }>;
  reservaciones: Array<{
    id: string;
    nombreTitular: string;
    telefono: string;
    lugarAbordaje?: string | null;
    totalPagar: number;
    totalAbonado: number;
    saldoPendiente: number;
    estado: "APARTADO" | "LIQUIDADO" | "CANCELADO";
    fechaReserva: string;
    asientos: Array<{ id: string; numero: number; estado: string }>;
    abonos: Array<{
      id: string;
      monto: number;
      fecha: string;
      metodo: "EFECTIVO" | "TRANSFERENCIA";
      comprobanteRef?: string | null;
      notas?: string | null;
    }>;
  }>;
}

export default function ViajeDetalleClient({ params }: ViajeDetalleClientProps) {
  const router = useRouter();
  const { id: viajeId } = useParams();
  const resolvedViajeId = viajeId as string;

  const [viaje, setViaje] = useState<ViajeDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("croquis");
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [detalleReservacion, setDetalleReservacion] = useState<ViajeDetalle["reservaciones"][0] | null>(null);
  const [showNuevaReserva, setShowNuevaReserva] = useState(false);
  const [showAbono, setShowAbono] = useState<{ reservacionId: string; saldoPendiente: number; nombreTitular: string } | null>(null);

  // Estado para selección múltiple en croquis
  const [asientosSeleccionados, setAsientosSeleccionados] = useState<string[]>([]);

  const fetchViaje = useCallback(async () => {
    if (!resolvedViajeId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/viajes/${resolvedViajeId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/");
          return;
        }
        throw new Error("Error al cargar el viaje");
      }
      const data = await res.json();
      setViaje(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [resolvedViajeId, router]);

  useEffect(() => {
    fetchViaje();
  }, [fetchViaje]);

  // Acciones del servidor
  const handleCrearReservacion = async (data: {
    nombreTitular: string;
    telefono: string;
    lugarAbordaje: string;
    anticipo: number;
    asientosIds: string[];
    notas?: string;
  }) => {
    const res = await fetch(`/api/viajes/${resolvedViajeId}/reservaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al crear reserva");
    }
    await fetchViaje();
    setAsientosSeleccionados([]);
  };

  const handleAddAbono = async (data: {
    monto: number;
    metodo: "EFECTIVO" | "TRANSFERENCIA";
    comprobanteRef?: string;
    notas?: string;
  }) => {
    if (!showAbono) return;
    const res = await fetch(`/api/reservaciones/${showAbono.reservacionId}/abonos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al registrar abono");
    }
    await fetchViaje();
    setShowAbono(null);
  };

  const handleCancelReservacion = async (reservacionId: string) => {
    if (!confirm("¿Cancelar esta reservación y liberar los asientos?")) return;
    const res = await fetch(`/api/reservaciones/${reservacionId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al cancelar");
    await fetchViaje();
    setDetalleReservacion(null);
  };

  const handleCheckIn = async (asientoId: string) => {
    const res = await fetch(`/api/asientos/${asientoId}/checkin`, { method: "POST" });
    if (!res.ok) throw new Error("Error en check-in");
    await fetchViaje();
  };

  const handleAddParada = async (data: {
    orden: number;
    lugar: string;
    tipo: string;
    descripcion?: string | null;
    incluyeCosto?: boolean;
  }) => {
    const res = await fetch(`/api/viajes/${resolvedViajeId}/paradas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al agregar parada");
    }
    await fetchViaje();
  };

  const handleDeleteParada = async (paradaId: string) => {
    const res = await fetch(`/api/paradas/${paradaId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar parada");
    await fetchViaje();
  };

  const handleAsientoClick = (asiento: ViajeDetalle["asientos"][0]) => {
    if (asiento.estado === "DISPONIBLE") return;
    if (asiento.reservacionId) {
      const reservacionCompleta = viaje?.reservaciones.find((r) => r.id === asiento.reservacionId);
      if (reservacionCompleta) {
        setDetalleReservacion({
          ...reservacionCompleta,
          asientos: viaje?.asientos
            .filter((a) => a.reservacionId === asiento.reservacionId)
            .map((a) => ({ id: a.id, numero: a.numero, estado: a.estado })) || [],
        });
      }
    }
  };

  const handleSeleccionarMultiples = (ids: string[]) => {
    setAsientosSeleccionados(ids);
  };

  const abrirNuevaReserva = () => {
    if (asientosSeleccionados.length === 0) return;
    setShowNuevaReserva(true);
  };

  const abrirAbono = (reservacion: ViajeDetalle["reservaciones"][0]) => {
    setShowAbono({
      reservacionId: reservacion.id,
      saldoPendiente: reservacion.saldoPendiente,
      nombreTitular: reservacion.nombreTitular,
    });
  };

  const asientosDisponibles = viaje?.asientos.filter((a) => a.estado === "DISPONIBLE") || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900">Viaje no encontrado</h2>
            <Link href="/" className="mt-4 text-emerald-600 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return { label: "Activo", color: "bg-blue-100 text-blue-800" };
      case "EN_CURSO":
        return { label: "En curso", color: "bg-emerald-100 text-emerald-800" };
      case "FINALIZADO":
        return { label: "Finalizado", color: "bg-zinc-100 text-zinc-800" };
      case "CANCELADO":
        return { label: "Cancelado", color: "bg-red-100 text-red-800" };
      default:
        return { label: estado, color: "bg-zinc-100 text-zinc-800" };
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "croquis", label: "Croquis", icon: <Bus className="h-4 w-4" /> },
    { id: "reservas", label: "Reservas", icon: <Users className="h-4 w-4" />, count: viaje.reservaciones.length },
    { id: "itinerario", label: "Itinerario", icon: <MapPin className="h-4 w-4" />, count: viaje.paradas.length },
    { id: "abordaje", label: "Abordaje", icon: <ClipboardCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Header del viaje */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                aria-label="Volver al dashboard"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-zinc-900">{viaje.titulo}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    viaje.tipo === "CORTO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                  }`}>
                    {viaje.tipo === "CORTO" ? "3 días" : "7 días"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoConfig(viaje.estado).color}`}>
                    {getEstadoConfig(viaje.estado).label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {viaje.destino}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-4 w-4" />
                    Salida: {formatFecha(viaje.fechaSalida)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-4 w-4" />
                    Regreso: {formatFecha(viaje.fechaRegreso)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-600 font-semibold">${viaje.precioBoleto.toFixed(2)}</span>
                    por boleto
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchViaje}
                disabled={loading}
                className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                aria-label="Actualizar"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <nav className="border-b border-zinc-200 overflow-x-auto" aria-label="Pestañas del viaje">
              <ul className="flex min-w-max" role="tablist">
                {tabs.map((tab) => (
                  <li key={tab.id} role="presentation">
                    <button
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`panel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-emerald-600 text-emerald-600"
                          : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Paneles */}
            <div className="p-4 sm:p-6">
              {activeTab === "croquis" && (
                <div id="panel-croquis" role="tabpanel" aria-labelledby="tab-croquis">
                  <CroquisAutobus
                    asientos={viaje.asientos}
                    onAsientoClick={handleAsientoClick}
                    onSeleccionarMultiples={handleSeleccionarMultiples}
                    asientosSeleccionados={asientosSeleccionados}
                    totalSeleccionados={asientosSeleccionados.length}
                    precioBoleto={viaje.precioBoleto}
                    onApartarSeleccionados={abrirNuevaReserva}
                  />
                  {asientosSeleccionados.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={abrirNuevaReserva}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation flex items-center gap-2"
                      >
                        <Users className="h-5 w-5" />
                        Apartar {asientosSeleccionados.length} Asiento{asientosSeleccionados.length > 1 ? "s" : ""}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reservas" && (
                <div id="panel-reservas" role="tabpanel" aria-labelledby="tab-reservas" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold text-zinc-900">Reservas y Abonos</h2>
                    <button
                      onClick={abrirNuevaReserva}
                      disabled={asientosDisponibles.length === 0}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Nueva Reserva
                    </button>
                  </div>

                  {viaje.reservaciones.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl">
                      <Users className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                      <p className="text-zinc-500">No hay reservas registradas</p>
                      <p className="text-sm text-zinc-400 mt-1">Selecciona asientos en el croquis y crea una nueva reserva</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {viaje.reservaciones.map((reservacion) => (
                        <div
                          key={reservacion.id}
                          className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <p className="font-semibold text-zinc-900">{reservacion.nombreTitular}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  reservacion.estado === "LIQUIDADO"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {reservacion.estado}
                                </span>
                                {reservacion.saldoPendiente > 0 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Saldo: ${reservacion.saldoPendiente.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                <span>{reservacion.asientos.length} asiento{reservacion.asientos.length > 1 ? "s" : ""}: {reservacion.asientos.map((a) => a.numero).join(", ")}</span>
                                <span>Tel: {reservacion.telefono}</span>
                                {reservacion.lugarAbordaje && <span>📍 {reservacion.lugarAbordaje}</span>}
                                <span>${reservacion.totalAbonado.toFixed(2)} / ${reservacion.totalPagar.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${formatWhatsAppPhone(reservacion.telefono)}?text=${encodeURIComponent(
                                  `🚌 Turismo Santa Cruz - Recibo\n\nViaje: ${viaje.titulo} → ${viaje.destino}\nFecha: ${formatFecha(viaje.fechaSalida)}\nTitular: ${reservacion.nombreTitular}\nAsientos: ${reservacion.asientos.map((a) => a.numero).join(", ")}\nTotal: $${reservacion.totalPagar.toFixed(2)}\nAbonado: $${reservacion.totalAbonado.toFixed(2)}\nSaldo: $${reservacion.saldoPendiente.toFixed(2)}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                                aria-label="Enviar recibo por WhatsApp"
                              >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378 3.39 3.39 0 01-1.005-1.015 11.26 11.26 0 01.412-5.331c.12-.327.224-.64.297-.95.094-.382.045-.764-.042-1.067-.086-.307-.38-.836-.793-1.07-.676-.38-1.233-.708-1.616-.92-.383-.212-.736-.375-1.036-.508-.3-.133-.653-.224-1.037-.31-.383-.086-.767-.125-1.174-.125-.383 0-.767.023-1.174.124-.383.086-.736.177-1.037.31-.3.133-.653.295-1.036.508-.383.212-.94.54-1.616.92-.413.234-.707.764-.793 1.07-.087.303-.136.685-.042 1.067.073.31.177.623.297.95a11.13 11.13 0 01.412 5.331 3.437 3.437 0 01-1.005 1.015c-.918.54-2.318.964-3.77 1.246a.54.54 0 00-.194.445.53.53 0 00.67.221h.004a9.87 9.87 0 005.031-1.378 3.406 3.406 0 001.005-1.015 11.16 11.16 0 00-.412-5.331c-.12-.327-.224-.64-.297-.95-.094-.382-.045-.764.042-1.067.086-.307.38-.836.793-1.07.676-.38 1.233-.708 1.616-.92.383-.212.736-.375 1.036-.508.3-.133.653.224 1.037-.31.383-.086.767.124 1.174.124.383.086.736.177 1.037.31.3.133.653.295 1.036.508.383.212.94.54 1.616.92.413.234.707.764.793 1.07.087.303.136.685.042 1.067-.073.31-.177.623-.297.95a11.13 11.13 0 00-.412 5.331 3.437 3.437 0 001.005 1.015c.918.54 2.318.964 3.77 1.246a.54.54 0 00.194.445.53.53 0 00-.67.221z" />
                                </svg>
                              </a>
                              <button
                                onClick={() => abrirAbono(reservacion)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                                aria-label="Registrar abono"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleCancelReservacion(reservacion.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                                aria-label="Cancelar reserva"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "itinerario" && (
                <div id="panel-itinerario" role="tabpanel" aria-labelledby="tab-itinerario">
                  <ItinerarioView
                    viajeId={viaje.id}
                    paradas={viaje.paradas as Parada[]}
                    onAddParada={handleAddParada}
                    onDeleteParada={handleDeleteParada}
                  />
                </div>
              )}

              {activeTab === "abordaje" && (
                <div id="panel-abordaje" role="tabpanel" aria-labelledby="tab-abordaje">
                  <ModoAbordaje
                    asientos={viaje.asientos as AsientoAbordaje[]}
                    viajeTitulo={viaje.titulo}
                    viajeDestino={viaje.destino}
                    viajeFechaSalida={viaje.fechaSalida}
                    onCheckIn={handleCheckIn}
                    onVerDetalle={(reservacionId) => {
                      const res = viaje.reservaciones.find((r) => r.id === reservacionId);
                      if (res) {
                        setDetalleReservacion({
                          ...res,
                          asientos: viaje.asientos
                            .filter((a) => a.reservacionId === reservacionId)
                            .map((a) => ({ id: a.id, numero: a.numero, estado: a.estado })),
                          abonos: res.abonos,
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      {detalleReservacion && (
        <ModalDetalleAsiento
          reservacion={detalleReservacion}
          onClose={() => setDetalleReservacion(null)}
          onRegistrarAbono={() => {
            setShowAbono({
              reservacionId: detalleReservacion.id,
              saldoPendiente: detalleReservacion.saldoPendiente,
              nombreTitular: detalleReservacion.nombreTitular,
            });
            setDetalleReservacion(null);
          }}
          onCancelarReserva={() => handleCancelReservacion(detalleReservacion.id)}
          viajeTitulo={viaje.titulo}
          viajeDestino={viaje.destino}
          viajeFechaSalida={viaje.fechaSalida}
          precioBoleto={viaje.precioBoleto}
        />
      )}

      {showNuevaReserva && (
        <ModalNuevaReserva
          asientosDisponibles={asientosDisponibles}
          asientosSeleccionados={asientosSeleccionados}
          precioBoleto={viaje.precioBoleto}
          viajeId={viaje.id}
          onClose={() => setShowNuevaReserva(false)}
          onSubmit={handleCrearReservacion}
        />
      )}

      {showAbono && (
        <ModalAbono
          reservacionId={showAbono.reservacionId}
          saldoPendiente={showAbono.saldoPendiente}
          nombreTitular={showAbono.nombreTitular}
          onClose={() => setShowAbono(null)}
          onSubmit={handleAddAbono}
        />
      )}
    </div>
  );
}