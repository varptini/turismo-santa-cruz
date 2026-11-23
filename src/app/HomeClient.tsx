"use client";

import { useState, useEffect } from "react";
import { Plus, Bus, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ModalNuevoViaje from "@/components/ModalNuevoViaje";

export interface ViajeDashboard {
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
  asientosOcupados: number;
  asientosLibres: number;
  totalRecaudado: number;
  ganancia: number;
  porcentajeOcupacion: number;
}

interface HomeClientProps {
  initialViajes: ViajeDashboard[];
}

export default function HomeClient({ initialViajes }: HomeClientProps) {
  const [viajes, setViajes] = useState<ViajeDashboard[]>(initialViajes);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViajes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/viajes");
      if (!res.ok) throw new Error("Error al cargar viajes");
      const data = await res.json();
      setViajes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("nuevo") === "true") {
        setShowModal(true);
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  const handleCrearViaje = async (data: {
    titulo: string;
    tipo: "CORTO" | "LARGO";
    destino: string;
    fechaSalida: string;
    fechaRegreso: string;
    precioBoleto: number;
    costoRentaCamion: number;
    totalAsientos: number;
    inclusiones?: string;
    notas?: string;
  }) => {
    setModalLoading(true);
    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear viaje");
      }
      await fetchViajes();
      setShowModal(false);
    } catch (err) {
      throw err;
    } finally {
      setModalLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return { label: "Activo", color: "bg-blue-100 text-blue-800", icon: <Calendar className="h-3 w-3" /> };
      case "EN_CURSO":
        return { label: "En curso", color: "bg-emerald-100 text-emerald-800", icon: <Bus className="h-3 w-3" /> };
      case "FINALIZADO":
        return { label: "Finalizado", color: "bg-zinc-100 text-zinc-800", icon: <CheckCircle className="h-3 w-3" /> };
      case "CANCELADO":
        return { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-3 w-3" /> };
      default:
        return { label: estado, color: "bg-zinc-100 text-zinc-800", icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  const getTipoConfig = (tipo: string) => {
    if (tipo === "CORTO") return { label: "3 días", color: "bg-blue-100 text-blue-800" };
    if (tipo === "LARGO") return { label: "7 días", color: "bg-purple-100 text-purple-800" };
    return { label: tipo, color: "bg-zinc-100 text-zinc-800" };
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar onNuevoViaje={() => setShowModal(true)} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Dashboard de Viajes</h1>
              <p className="text-zinc-500 mt-1">Gestiona tus viajes, reservas y abordajes desde Cruz Grande</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nuevo Viaje
            </button>
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          )}

          {/* Lista de viajes */}
          {viajes.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
              <Bus className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">No hay viajes registrados</h2>
              <p className="text-zinc-500 mb-6">Crea tu primer viaje para empezar a gestionar reservas</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Crear Primer Viaje
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {viajes.map((viaje) => {
                const estadoConfig = getEstadoConfig(viaje.estado);
                const tipoConfig = getTipoConfig(viaje.tipo);

                return (
                  <Link
                    key={viaje.id}
                    href={`/viajes/${viaje.id}`}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all duration-200 block"
                  >
                    <div className="p-5">
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-zinc-900 truncate">{viaje.titulo}</h3>
                          <p className="text-zinc-500 text-sm mt-1">{viaje.destino}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tipoConfig.color}`}>
                            {tipoConfig.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.color} flex items-center gap-1`}>
                            {estadoConfig.icon}
                            {estadoConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="flex items-center gap-4 text-sm text-zinc-600 mb-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-4 w-4 text-zinc-400" />
                          {formatFecha(viaje.fechaSalida)} - {formatFecha(viaje.fechaRegreso)}
                        </span>
                      </div>

                      {/* Barra de ocupación */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-zinc-500">Ocupación</span>
                          <span className="font-semibold text-zinc-800">
                            {viaje.asientosOcupados} / {viaje.totalAsientos} ({viaje.porcentajeOcupacion.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(viaje.porcentajeOcupacion, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Métricas financieras */}
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100">
                        <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-emerald-600">${viaje.totalRecaudado.toLocaleString("es-MX")}</p>
                          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Recaudado</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl sm:text-2xl font-black text-zinc-700">${viaje.costoRentaCamion.toLocaleString("es-MX")}</p>
                          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Costo Renta</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xl sm:text-2xl font-black ${viaje.ganancia >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                            ${viaje.ganancia.toLocaleString("es-MX")}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Ganancia</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Nuevo Viaje */}
      {showModal && (
        <ModalNuevoViaje
          onClose={() => setShowModal(false)}
          onSubmit={handleCrearViaje}
          isLoading={modalLoading}
        />
      )}
    </div>
  );
}
