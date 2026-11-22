"use client";

import { useState, FormEvent } from "react";
import { X, DollarSign, CreditCard, ArrowRightLeft, CheckCircle, AlertCircle } from "lucide-react";

interface ModalAbonoProps {
  reservacionId: string;
  saldoPendiente: number;
  nombreTitular: string;
  onClose: () => void;
  onSubmit: (data: {
    monto: number;
    metodo: "EFECTIVO" | "TRANSFERENCIA";
    comprobanteRef?: string;
    notas?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ModalAbono({
  reservacionId,
  saldoPendiente,
  nombreTitular,
  onClose,
  onSubmit,
  isLoading = false,
}: ModalAbonoProps) {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA">("EFECTIVO");
  const [comprobanteRef, setComprobanteRef] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const montoNum = parseFloat(monto) || 0;
  const nuevoSaldo = Math.max(0, saldoPendiente - montoNum);
  const liquidaTotal = montoNum >= saldoPendiente;

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (montoNum <= 0) {
      nuevosErrores.monto = "El monto debe ser mayor a 0";
    }

    if (montoNum > saldoPendiente + 0.01) {
      nuevosErrores.monto = `El monto no puede exceder el saldo pendiente ($${saldoPendiente.toFixed(2)})`;
    }

    if (metodo === "TRANSFERENCIA" && !comprobanteRef.trim()) {
      nuevosErrores.comprobanteRef = "La referencia de transferencia es obligatoria";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      await onSubmit({
        monto: montoNum,
        metodo,
        comprobanteRef: comprobanteRef.trim() || undefined,
        notas: notas.trim() || undefined,
      });
      onClose();
    } catch (error) {
      setErrores({ submit: error instanceof Error ? error.message : "Error al registrar el abono" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-abono-title">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="modal-abono-title" className="text-lg font-semibold text-zinc-900">
            Registrar Abono
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors touch-manipulation disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info del titular y saldo */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <span className="font-medium text-zinc-900">{nombreTitular}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500">Saldo pendiente actual</p>
                <p className="font-semibold text-red-600">${saldoPendiente.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Saldo después del abono</p>
                <p className={`font-semibold ${nuevoSaldo > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ${nuevoSaldo.toFixed(2)}
                </p>
              </div>
            </div>
            {liquidaTotal && (
              <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Este abono liquida la reserva completamente. Los asientos pasarán a estado PAGADO.
              </div>
            )}
          </div>

          {/* Monto */}
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-zinc-700 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
              <input
                type="number"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="0.01"
                step="0.01"
                max={saldoPendiente}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                  errores.monto ? "border-red-500" : "border-zinc-300"
                }`}
                placeholder="0.00"
                disabled={isLoading}
                aria-invalid={!!errores.monto}
                aria-describedby={errores.monto ? "error-monto" : "ayuda-monto"}
              />
            </div>
            <p id="ayuda-monto" className="mt-1 text-xs text-zinc-500">
              Saldo pendiente: ${saldoPendiente.toFixed(2)}. {liquidaTotal ? "Este monto liquida la reserva." : ""}
            </p>
            {errores.monto && (
              <p id="error-monto" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errores.monto}
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Método de pago">
              <button
                type="button"
                onClick={() => setMetodo("EFECTIVO")}
                className={`relative p-4 rounded-lg border-2 transition-colors touch-manipulation flex flex-col items-center gap-2 ${
                  metodo === "EFECTIVO"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                aria-pressed={metodo === "EFECTIVO"}
              >
                <CreditCard className={`h-8 w-8 ${metodo === "EFECTIVO" ? "text-emerald-600" : "text-zinc-400"}`} aria-hidden="true" />
                <span className={`font-medium ${metodo === "EFECTIVO" ? "text-emerald-700" : "text-zinc-700"}`}>Efectivo</span>
                {metodo === "EFECTIVO" && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center" aria-hidden="true">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMetodo("TRANSFERENCIA")}
                className={`relative p-4 rounded-lg border-2 transition-colors touch-manipulation flex flex-col items-center gap-2 ${
                  metodo === "TRANSFERENCIA"
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                aria-pressed={metodo === "TRANSFERENCIA"}
              >
                <ArrowRightLeft className={`h-8 w-8 ${metodo === "TRANSFERENCIA" ? "text-blue-600" : "text-zinc-400"}`} aria-hidden="true" />
                <span className={`font-medium ${metodo === "TRANSFERENCIA" ? "text-blue-700" : "text-zinc-700"}`}>Transferencia</span>
                {metodo === "TRANSFERENCIA" && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center" aria-hidden="true">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Referencia de transferencia */}
          {metodo === "TRANSFERENCIA" && (
            <div>
              <label htmlFor="comprobanteRef" className="block text-sm font-medium text-zinc-700 mb-1">
                Referencia / Comprobante <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="comprobanteRef"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errores.comprobanteRef ? "border-red-500" : "border-zinc-300"
                }`}
                placeholder="Clave de rastreo, folio, etc."
                disabled={isLoading}
                aria-invalid={!!errores.comprobanteRef}
                aria-describedby={errores.comprobanteRef ? "error-comprobante" : undefined}
              />
              {errores.comprobanteRef && (
                <p id="error-comprobante" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {errores.comprobanteRef}
                </p>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-zinc-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              placeholder="Observaciones..."
              disabled={isLoading}
            />
          </div>

          {/* Error general */}
          {errores.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {errores.submit}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-colors touch-manipulation disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  Registrar Abono
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}