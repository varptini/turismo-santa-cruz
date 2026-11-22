"use client";

import { useEffect } from "react";
import { X, Phone, MessageCircle, DollarSign, Calendar, CreditCard, Trash2, AlertTriangle } from "lucide-react";
import { buildWhatsAppReceiptUrl } from "@/lib/whatsapp";

interface ReservacionDetalle {
  id: string;
  nombreTitular: string;
  telefono: string;
  lugarAbordaje?: string | null;
  totalPagar: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: "APARTADO" | "LIQUIDADO" | "CANCELADO";
  fechaReserva: Date | string;
  asientos: Array<{
    id: string;
    numero: number;
    estado: string;
  }>;
  abonos: Array<{
    id: string;
    monto: number;
    fecha: Date | string;
    metodo: "EFECTIVO" | "TRANSFERENCIA";
    comprobanteRef?: string | null;
    notas?: string | null;
  }>;
}

interface ModalDetalleAsientoProps {
  reservacion: ReservacionDetalle | null;
  onClose: () => void;
  onRegistrarAbono: () => void;
  onCancelarReserva: () => void;
  viajeTitulo: string;
  viajeDestino: string;
  viajeFechaSalida: Date | string;
  precioBoleto: number;
}

const ESTADO_COLORES = {
  APARTADO: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LIQUIDADO: "bg-green-100 text-green-800 border-green-200",
  CANCELADO: "bg-red-100 text-red-800 border-red-200",
} as const;

export default function ModalDetalleAsiento({
  reservacion,
  onClose,
  onRegistrarAbono,
  onCancelarReserva,
  viajeTitulo,
  viajeDestino,
  viajeFechaSalida,
  precioBoleto,
}: ModalDetalleAsientoProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!reservacion) return null;

  const formatFecha = (fecha: Date | string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFechaCorta = (fecha: Date | string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generarMensajeWhatsApp = () => {
    return buildWhatsAppReceiptUrl(reservacion.telefono, {
      viajeTitulo,
      viajeDestino,
      viajeFechaSalida,
      nombreTitular: reservacion.nombreTitular,
      asientosNumeros: reservacion.asientos.map((a) => a.numero),
      totalPagar: reservacion.totalPagar,
      totalAbonado: reservacion.totalAbonado,
      saldoPendiente: reservacion.saldoPendiente,
      lugarAbordaje: reservacion.lugarAbordaje,
      abonos: reservacion.abonos.map((a) => ({
        monto: a.monto,
        metodo: a.metodo,
        fecha: a.fecha,
        comprobanteRef: a.comprobanteRef,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-zinc-900">
              Detalle de Reserva
            </h2>
            <p className="text-sm text-zinc-500">{viajeTitulo} → {viajeDestino}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors touch-manipulation"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info del viaje */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500">Viaje</p>
                <p className="font-medium text-zinc-900">{viajeTitulo}</p>
              </div>
              <div>
                <p className="text-zinc-500">Destino</p>
                <p className="font-medium text-zinc-900">{viajeDestino}</p>
              </div>
              <div>
                <p className="text-zinc-500">Fecha salida</p>
                <p className="font-medium text-zinc-900">{formatFechaCorta(viajeFechaSalida)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Precio boleto</p>
                <p className="font-medium text-zinc-900">${precioBoleto.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Info del titular */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              Titular de la reserva
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500">Nombre</p>
                <p className="font-medium text-zinc-900">{reservacion.nombreTitular}</p>
              </div>
              <div>
                <p className="text-zinc-500">Teléfono</p>
                <p className="font-medium text-zinc-900">{reservacion.telefono}</p>
              </div>
              <div>
                <p className="text-zinc-500">Lugar de abordaje</p>
                <p className="font-medium text-zinc-900">{reservacion.lugarAbordaje || "Cruz Grande, Gro."}</p>
              </div>
              <div>
                <p className="text-zinc-500">Fecha de reserva</p>
                <p className="font-medium text-zinc-900">{formatFecha(reservacion.fechaReserva)}</p>
              </div>
            </div>
          </div>

          {/* Asientos del grupo */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              Asientos del grupo ({reservacion.asientos.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {reservacion.asientos.map((asiento) => (
                <span
                  key={asiento.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    asiento.estado === "PAGADO"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  Asiento {asiento.numero}
                </span>
              ))}
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              Resumen de pagos
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Total a pagar ({reservacion.asientos.length} boletos)</span>
                <span className="font-medium text-zinc-900">${reservacion.totalPagar.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Total abonado</span>
                <span className="font-medium text-emerald-600">${reservacion.totalAbonado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2">
                <span className="text-zinc-600">Saldo pendiente</span>
                <span className={`font-semibold ${reservacion.saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ${reservacion.saldoPendiente.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Badge de estado */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${ESTADO_COLORES[reservacion.estado]}`}
              >
                {reservacion.estado === "APARTADO" && <AlertTriangle className="h-3 w-3 inline mr-1" aria-hidden="true" />}
                {reservacion.estado === "LIQUIDADO" && <span className="inline-block w-3 h-3 mr-1" aria-hidden="true">✓</span>}
                {reservacion.estado}
              </span>
              {reservacion.saldoPendiente > 0 && (
                <span className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded border border-red-200">
                  Pendiente al abordar
                </span>
              )}
            </div>
          </div>

          {/* Historial de abonos */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                Historial de abonos ({reservacion.abonos.length})
              </h3>
              <button
                type="button"
                onClick={onRegistrarAbono}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors touch-manipulation"
              >
                Registrar Abono
              </button>
            </div>

            {reservacion.abonos.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No hay abonos registrados</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reservacion.abonos.map((abono) => {
                  const Icon = abono.metodo === "EFECTIVO" ? CreditCard : DollarSign;
                  return (
                    <div key={abono.id} className="bg-white border border-zinc-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          <span className="font-medium text-zinc-900">${abono.monto.toFixed(2)}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-600">{abono.metodo}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{formatFecha(abono.fecha)}</span>
                      </div>
                      {abono.comprobanteRef && (
                        <p className="mt-1 text-xs text-zinc-500">Ref: {abono.comprobanteRef}</p>
                      )}
                      {abono.notas && (
                        <p className="mt-1 text-xs text-zinc-500">{abono.notas}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex_row gap-3 pt-2 border-t border-zinc-200">
            <a
              href={generarMensajeWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors touch-manipulation"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Enviar Recibo por WhatsApp
            </a>
            <button
              type="button"
              onClick={onCancelarReserva}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors touch-manipulation"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Cancelar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}