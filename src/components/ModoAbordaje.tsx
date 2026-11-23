"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, XCircle, User, CreditCard, Phone, MapPin, Filter, Download, Search } from "lucide-react";

export interface AsientoAbordaje {
  id: string;
  numero: number;
  estado: "DISPONIBLE" | "APARTADO" | "PAGADO" | "BLOQUEADO";
  nombreOcupante?: string | null;
  reservacion?: {
    id: string;
    nombreTitular: string;
    telefono: string;
    lugarAbordaje?: string | null;
    totalPagar: number;
    totalAbonado: number;
    saldoPendiente: number;
    estado: "APARTADO" | "LIQUIDADO" | "CANCELADO";
  } | null;
}

interface ModoAbordajeProps {
  asientos: AsientoAbordaje[];
  viajeTitulo: string;
  viajeDestino: string;
  viajeFechaSalida: Date | string;
  onCheckIn: (asientoId: string) => Promise<void>;
  onVerDetalle: (reservacionId: string) => void;
}

const ESTADO_ABORDAJE = {
  PAGADO: { label: "Pagado", color: "bg-green-100 text-green-800 border-green-200", bgColor: "#dcfce7", icon: CheckCircle },
  APARTADO: { label: "Apartado", color: "bg-yellow-100 text-yellow-800 border-yellow-200", bgColor: "#fef9c3", icon: AlertCircle },
  BLOQUEADO: { label: "Staff", color: "bg-zinc-100 text-zinc-700 border-zinc-200", bgColor: "#f4f4f5", icon: User },
  DISPONIBLE: { label: "Vacío", color: "bg-zinc-100 text-zinc-500 border-zinc-200", bgColor: "#f4f4f5", icon: XCircle },
} as const;

export default function ModoAbordaje({
  asientos,
  viajeTitulo,
  viajeDestino,
  viajeFechaSalida,
  onCheckIn,
  onVerDetalle,
}: ModoAbordajeProps) {
  const [filtro, setFiltro] = useState<"todos" | "por_abordar" | "abordados" | "con_saldo">("todos");
  const [busqueda, setBusqueda] = useState("");

  const formatFecha = (fecha: Date | string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Filtrar asientos con reservación
  const asientosConReserva = useMemo(() => {
    return asientos
      .filter((a) => a.reservacion && a.estado !== "DISPONIBLE" && a.estado !== "BLOQUEADO")
      .sort((a, b) => a.numero - b.numero);
  }, [asientos]);

  const asientosFiltrados = useMemo(() => {
    let resultado = asientosConReserva;

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (a) =>
          a.numero.toString().includes(termino) ||
          a.reservacion?.nombreTitular.toLowerCase().includes(termino) ||
          a.reservacion?.telefono.includes(termino) ||
          a.reservacion?.lugarAbordaje?.toLowerCase().includes(termino)
      );
    }

    switch (filtro) {
      case "por_abordar":
        resultado = resultado.filter((a) => a.estado !== "PAGADO");
        break;
      case "abordados":
        resultado = resultado.filter((a) => a.estado === "PAGADO");
        break;
      case "con_saldo":
        resultado = resultado.filter((a) => a.reservacion && a.reservacion.saldoPendiente > 0);
        break;
    }

    return resultado;
  }, [asientosConReserva, filtro, busqueda]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = asientosConReserva.length;
    const pagados = asientosConReserva.filter((a) => a.estado === "PAGADO").length;
    const apartados = asientosConReserva.filter((a) => a.estado === "APARTADO").length;
    const conSaldo = asientosConReserva.filter((a) => a.reservacion?.saldoPendiente! > 0).length;
    const totalSaldo = asientosConReserva.reduce((sum, a) => sum + (a.reservacion?.saldoPendiente || 0), 0);

    return { total, pagados, apartados, conSaldo, totalSaldo };
  }, [asientosConReserva]);

  const handleCheckIn = async (asiento: AsientoAbordaje) => {
    if (asiento.estado === "PAGADO") return; // Ya abordado
    if (asiento.reservacion && asiento.reservacion.saldoPendiente > 0) {
      if (!confirm(`⚠️ ${asiento.reservacion.nombreTitular} tiene saldo pendiente de $${asiento.reservacion.saldoPendiente.toFixed(2)}.\n\n¿Confirmar abordaje de todos modos?`)) {
        return;
      }
    }
    await onCheckIn(asiento.id);
  };

  return (
    <div className="space-y-4">
      {/* Header del viaje */}
      <div className="bg-emerald-600 text-white rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{viajeTitulo}</h2>
            <p className="text-emerald-100 mt-1">{viajeDestino} • Salida: {formatFecha(viajeFechaSalida)}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">Modo Abordaje</span>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Pasajeros</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{stats.pagados}</p>
          <p className="text-xs text-zinc-500 mt-1">Listos (Pagado)</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-600">{stats.apartados}</p>
          <p className="text-xs text-zinc-500 mt-1">Apartados</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">{stats.conSaldo}</p>
          <p className="text-xs text-zinc-500 mt-1">Con Saldo Pendiente</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-zinc-900">${stats.totalSaldo.toFixed(2)}</p>
          <p className="text-xs text-zinc-500 mt-1">Por Cobrar</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por asiento, nombre, teléfono, lugar..."
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "todos", label: "Todos" },
              { value: "por_abordar", label: "⏳ Por Abordar" },
              { value: "abordados", label: "✅ Abordados" },
              { value: "con_saldo", label: "⚠️ Con Saldo" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value as typeof filtro)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filtro === f.value
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de abordaje */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {asientosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-zinc-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-zinc-500">No hay pasajeros que coincidan con el filtro</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {asientosFiltrados.map((asiento) => {
              const config = ESTADO_ABORDAJE[asiento.estado];
              const Icon = config.icon;
              const tieneSaldo = asiento.reservacion && asiento.reservacion.saldoPendiente > 0;
              const yaAbordado = asiento.estado === "PAGADO";

              return (
                <div
                  key={asiento.id}
                  className={`p-4 hover:bg-zinc-50 transition-colors ${
                    tieneSaldo && !yaAbordado ? "bg-red-50 border-l-4 border-red-500" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Número de asiento y estado */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-xl text-zinc-700 border border-zinc-200">
                        {asiento.numero}
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`} style={{ backgroundColor: config.bgColor }}>
                          <Icon className="h-3 w-3 inline mr-1" aria-hidden="true" />
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Info del pasajero */}
                    <div className="flex-1 min-w-0" onClick={() => asiento.reservacion && onVerDetalle(asiento.reservacion!.id)}>
                      {asiento.reservacion && (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-zinc-900 truncate">{asiento.reservacion.nombreTitular}</p>
                            {tieneSaldo && !yaAbordado && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                                Saldo: ${(asiento.reservacion.saldoPendiente ?? 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                              {asiento.reservacion.telefono}
                            </span>
                            {asiento.reservacion.lugarAbordaje && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                {asiento.reservacion.lugarAbordaje}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                              ${(asiento.reservacion.totalAbonado ?? 0).toFixed(2)} / ${(asiento.reservacion.totalPagar ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Acción de check-in */}
                    <div className="flex-shrink-0">
                      {yaAbordado ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-1 cursor-default"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          Abordado
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(asiento)}
                          className={`px-4 py-2 rounded-lg font-medium touch-manipulation transition-colors flex items-center gap-1 ${
                            tieneSaldo
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {tieneSaldo ? (
                            <>
                              <AlertCircle className="h-4 w-4" aria-hidden="true" />
                              Cobrar y Abordar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" aria-hidden="true" />
                              Abordar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen para impresión/exportación */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm">
        <p className="font-medium text-zinc-900 mb-2">Lista de abordaje - {formatFecha(viajeFechaSalida)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-600">
          <span>Asiento</span>
          <span>Pasajero</span>
          <span>Teléfono</span>
          <span>Estado</span>
        </div>
        <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
          {asientosConReserva
            .sort((a, b) => a.numero - b.numero)
            .map((asiento) => (
              <div key={asiento.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-2 py-1 text-xs border-b border-zinc-200 last:border-0">
                <span className="font-mono font-medium">{asiento.numero}</span>
                <span className="truncate">{asiento.reservacion?.nombreTitular || "-"}</span>
                <span>{asiento.reservacion?.telefono || "-"}</span>
                <span className={asiento.estado === "PAGADO" ? "text-green-600" : "text-yellow-600"}>
                  {asiento.estado === "PAGADO" ? "✅" : "⏳"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}