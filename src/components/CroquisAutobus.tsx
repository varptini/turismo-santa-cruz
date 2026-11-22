"use client";

import { useState, useCallback, useMemo } from "react";
import { User, AlertCircle, CheckCircle, MinusCircle, PlusCircle } from "lucide-react";

interface Asiento {
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
}

interface CroquisAutobusProps {
  asientos: Asiento[];
  onAsientoClick: (asiento: Asiento) => void;
  onSeleccionarMultiples: (asientosIds: string[]) => void;
  asientosSeleccionados: string[];
  totalSeleccionados: number;
  precioBoleto: number;
  onApartarSeleccionados?: () => void;
}

const COLUMNAS_CONFIG = [
  { key: "VENTANA_IZQ", label: "Ventana", side: "left" },
  { key: "PASILLO_IZQ", label: "Pasillo", side: "left" },
  { key: "PASILLO_DER", label: "Pasillo", side: "right" },
  { key: "VENTANA_DER", label: "Ventana", side: "right" },
] as const;

const ESTADO_COLORES = {
  DISPONIBLE: "bg-green-500 hover:bg-green-600 text-white border-green-600",
  APARTADO: "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 border-yellow-500",
  PAGADO: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
  BLOQUEADO: "bg-zinc-400 text-zinc-600 border-zinc-500 cursor-not-allowed",
} as const;

const ESTADO_LABELS = {
  DISPONIBLE: "Disponible",
  APARTADO: "Apartado",
  PAGADO: "Pagado",
  BLOQUEADO: "Bloqueado",
} as const;

export default function CroquisAutobus({
  asientos,
  onAsientoClick,
  onSeleccionarMultiples,
  asientosSeleccionados,
  totalSeleccionados,
  precioBoleto,
  onApartarSeleccionados,
}: CroquisAutobusProps) {
  const [hoveredAsiento, setHoveredAsiento] = useState<string | null>(null);

  // Organizar asientos por fila
  const asientosPorFila = useMemo(() => {
    const filas: Record<number, Asiento[]> = {};
    asientos.forEach((asiento) => {
      if (!filas[asiento.fila]) filas[asiento.fila] = [];
      filas[asiento.fila].push(asiento);
    });
    return filas;
  }, [asientos]);

  const filasOrdenadas = useMemo(() => Object.keys(asientosPorFila).map(Number).sort((a, b) => a - b), [asientosPorFila]);

  const handleAsientoClick = useCallback(
    (asiento: Asiento) => {
      if (asiento.estado === "BLOQUEADO") return;

      if (asiento.estado === "DISPONIBLE") {
        // Toggle selección múltiple
        const nuevosSeleccionados = asientosSeleccionados.includes(asiento.id)
          ? asientosSeleccionados.filter((id) => id !== asiento.id)
          : [...asientosSeleccionados, asiento.id];
        onSeleccionarMultiples(nuevosSeleccionados);
      } else {
        // Abrir detalle para asientos ocupados
        onAsientoClick(asiento);
      }
    },
    [asientosSeleccionados, onAsientoClick, onSeleccionarMultiples]
  );

  const getAsientoEnFila = (fila: number, columnaKey: string) => {
    return asientosPorFila[fila]?.find((a) => a.columna === columnaKey);
  };

  return (
    <div className="w-full">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200" role="legend" aria-label="Estados de asientos">
        {[
          { estado: "DISPONIBLE", label: "Disponible" },
          { estado: "APARTADO", label: "Apartado" },
          { estado: "PAGADO", label: "Pagado" },
          { estado: "BLOQUEADO", label: "Bloqueado" },
        ].map(({ estado, label }) => (
          <div key={estado} className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded border-2 ${ESTADO_COLORES[estado as keyof typeof ESTADO_COLORES]} flex items-center justify-center`}
              aria-hidden="true"
            >
              {estado === "DISPONIBLE" && <CheckCircle className="h-3 w-3" />}
              {estado === "APARTADO" && <AlertCircle className="h-3 w-3" />}
              {estado === "PAGADO" && <User className="h-3 w-3" />}
              {estado === "BLOQUEADO" && <MinusCircle className="h-3 w-3" />}
            </div>
            <span className="text-sm text-zinc-700">{label}</span>
          </div>
        ))}
      </div>

      {/* Frente del autobús */}
      <div className="relative mb-4" role="img" aria-label="Frente del autobús con parabrisas, volante y puerta">
        <div className="relative mx-auto max-w-md">
          {/* Parabrisas */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300/50 to-transparent rounded-t-2xl border-2 border-sky-400/50" aria-hidden="true" />
            <div className="relative flex items-center justify-center py-4 px-6">
              <div className="flex items-center justify-center gap-8">
                {/* Volante */}
                <div className="relative" aria-hidden="true">
                  <div className="w-10 h-10 rounded-full border-4 border-zinc-700 relative" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-6 bg-zinc-700" />
                    <div className="w-6 h-1 bg-zinc-700" />
                  </div>
                </div>
                <span className="text-lg font-semibold text-zinc-800">CONDUCTOR</span>
              </div>
            </div>
          </div>

          {/* Puerta de entrada */}
          <div className="flex justify-center -mt-2" aria-hidden="true">
            <div className="w-20 h-16 bg-zinc-800 rounded-b-lg border-2 border-zinc-700 border-t-0 flex items-center justify-center">
              <div className="w-8 h-12 bg-emerald-600 rounded-t border-2 border-emerald-400 border-b-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Cuadrícula de asientos */}
      <div className="overflow-x-auto pb-4" role="grid" aria-label="Plano de asientos del autobús">
        <table className="w-full min-w-[320px] max-w-lg mx-auto border-collapse" role="presentation">
          <thead>
            <tr className="hidden md:table-row" aria-hidden="true">
              <th className="w-8" />
              {COLUMNAS_CONFIG.map((col) => (
                <th key={col.key} className="px-2 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                  {col.label}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filasOrdenadas.map((filaNum) => (
              <tr key={filaNum} className="even:bg-zinc-50/50">
                <td className="w-8 px-1 text-center text-xs text-zinc-500 font-mono" aria-hidden="true">
                  {filaNum}
                </td>
                {COLUMNAS_CONFIG.map((colConfig) => {
                  const asiento = getAsientoEnFila(filaNum, colConfig.key);
                  const isLeftSide = colConfig.side === "left";
                  const isRightSide = colConfig.side === "right";
                  const isPasillo = colConfig.key.includes("PASILLO");

                  if (!asiento) {
                    return (
                      <td
                        key={colConfig.key}
                        className={`px-1 py-1.5 ${isLeftSide ? "border-r-0" : ""} ${isRightSide ? "border-l-0" : ""}`}
                        role="gridcell"
                        aria-hidden="true"
                      >
                        <div className="aspect-square" />
                      </td>
                    );
                  }

                  const estaSeleccionado = asientosSeleccionados.includes(asiento.id);
                  const clasesBase =
                    "relative w-full aspect-square min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg border-2 transition-all duration-150 flex items-center justify-center font-medium text-sm touch-manipulation select-none";
                  const clasesEstado = ESTADO_COLORES[asiento.estado];
                  const clasesSeleccion = estaSeleccionado
                    ? "ring-4 ring-emerald-500 ring-offset-2 scale-105 shadow-lg"
                    : "";
                  const clasesHover =
                    asiento.estado !== "BLOQUEADO" && !estaSeleccionado
                      ? "hover:scale-110 hover:shadow-md"
                      : "";

                  return (
                    <td
                      key={colConfig.key}
                      className={`relative px-1 py-1.5 ${isLeftSide ? "border-r-0" : ""} ${isRightSide ? "border-l-0" : ""} ${
                        isPasillo ? "md:pl-4 md:pr-4" : ""
                      }`}
                      role="gridcell"
                      aria-label={`Asiento ${asiento.numero}, Fila ${asiento.fila}, ${ESTADO_LABELS[asiento.estado]}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleAsientoClick(asiento)}
                        onMouseEnter={() => setHoveredAsiento(asiento.id)}
                        onMouseLeave={() => setHoveredAsiento(null)}
                        disabled={asiento.estado === "BLOQUEADO"}
                        className={`${clasesBase} ${clasesEstado} ${clasesSeleccion} ${clasesHover} ${
                          hoveredAsiento === asiento.id ? "z-10" : ""
                        }`}
                        aria-pressed={estaSeleccionado}
                        aria-disabled={asiento.estado === "BLOQUEADO"}
                        aria-label={
                          asiento.estado === "DISPONIBLE"
                            ? `Asiento ${asiento.numero} disponible. ${estaSeleccionado ? "Seleccionado" : "Tocar para seleccionar"}`
                            : `Asiento ${asiento.numero} ${ESTADO_LABELS[asiento.estado]}. ${asiento.nombreOcupante ? `Ocupado por ${asiento.nombreOcupante}` : ""}. Tocar para ver detalles.`
                        }
                      >
                        <span className="font-mono text-lg leading-none">{asiento.numero}</span>
                        {asiento.estado === "BLOQUEADO" && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-600 rounded-full flex items-center justify-center" aria-hidden="true">
                            <MinusCircle className="h-3 w-3 text-white" />
                          </span>
                        )}
                        {estaSeleccionado && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center" aria-hidden="true">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </span>
                        )}
                        {asiento.estado === "APARTADO" && (
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" aria-hidden="true" />
                        )}
                      </button>

                      {/* Tooltip en hover para asientos ocupados */}
                      {(hoveredAsiento === asiento.id || estaSeleccionado) && asiento.estado !== "DISPONIBLE" && asiento.estado !== "BLOQUEADO" && (
                        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-zinc-900 text-white text-xs rounded-lg shadow-lg opacity-0 animate-fade-in pointer-events-none whitespace-nowrap">
                          <div className="font-medium">{asiento.nombreOcupante || "Sin nombre"}</div>
                          {asiento.reservacion && (
                            <>
                              <div>Saldo: ${asiento.reservacion.saldoPendiente.toFixed(2)}</div>
                              <div>Estado: {asiento.reservacion.estado}</div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="w-8 px-1 text-center text-xs text-zinc-500 font-mono" aria-hidden="true">
                  {filaNum}
                </td>
              </tr>
            ))}

            {/* Fila del baño (WC) al final */}
            <tr className="bg-zinc-100">
              <td className="w-8" />
              <td colSpan={4} className="px-2 py-3 text-center">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-200 rounded-lg border border-zinc-300" role="img" aria-label="Baño en la parte trasera del autobús">
                  <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">WC</span>
                </div>
              </td>
              <td className="w-8" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barra de resumen de selección */}
      {totalSeleccionados > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up" role="status" aria-live="polite">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{totalSeleccionados} asientos seleccionados</p>
                <p className="text-sm text-zinc-600">Total: ${(totalSeleccionados * precioBoleto).toFixed(2)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onApartarSeleccionados) {
                  onApartarSeleccionados();
                }
              }}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation"
            >
              Apartar Asientos
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.15s ease-out forwards; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}