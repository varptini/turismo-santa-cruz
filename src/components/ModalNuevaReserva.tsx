"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, User, Phone, MapPin, DollarSign, Calculator, AlertCircle, CheckCircle } from "lucide-react";

interface ModalNuevaReservaProps {
  asientosDisponibles: Array<{ id: string; numero: number }>;
  asientosSeleccionados: string[];
  precioBoleto: number;
  viajeId: string;
  onClose: () => void;
  onSubmit: (data: {
    nombreTitular: string;
    telefono: string;
    lugarAbordaje: string;
    anticipo: number;
    asientosIds: string[];
    notas?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ModalNuevaReserva({
  asientosDisponibles,
  asientosSeleccionados,
  precioBoleto,
  viajeId,
  onClose,
  onSubmit,
  isLoading = false,
}: ModalNuevaReservaProps) {
  const [nombreTitular, setNombreTitular] = useState("");
  const [telefono, setTelefono] = useState("");
  const [lugarAbordaje, setLugarAbordaje] = useState("");
  const [anticipo, setAnticipo] = useState("");
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const totalPagar = asientosSeleccionados.length * precioBoleto;
  const anticipoNum = parseFloat(anticipo) || 0;
  const saldoPendiente = Math.max(0, totalPagar - anticipoNum);

  // Validar teléfono (10 dígitos)
  const validarTelefono = (tel: string) => {
    const numeros = tel.replace(/\D/g, "");
    return numeros.length === 10;
  };

  // Formatear teléfono mientras se escribe
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    // Formato: (XXX) XXX-XXXX
    if (value.length >= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    setTelefono(value);
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombreTitular.trim()) {
      nuevosErrores.nombreTitular = "El nombre del titular es obligatorio";
    } else if (nombreTitular.trim().length < 3) {
      nuevosErrores.nombreTitular = "El nombre debe tener al menos 3 caracteres";
    }

    if (!validarTelefono(telefono)) {
      nuevosErrores.telefono = "Ingresa un teléfono válido de 10 dígitos";
    }

    if (anticipoNum < 0) {
      nuevosErrores.anticipo = "El anticipo no puede ser negativo";
    }

    if (anticipoNum > totalPagar) {
      nuevosErrores.anticipo = "El anticipo no puede ser mayor al total";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      await onSubmit({
        nombreTitular: nombreTitular.trim(),
        telefono: telefono.replace(/\D/g, ""),
        lugarAbordaje: lugarAbordaje.trim() || "Cruz Grande, Gro.",
        anticipo: anticipoNum,
        asientosIds: asientosSeleccionados,
        notas: notas.trim() || undefined,
      });
      onClose();
    } catch (error) {
      setErrores({ submit: error instanceof Error ? error.message : "Error al crear la reserva" });
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-nueva-reserva-title">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="modal-nueva-reserva-title" className="text-lg font-semibold text-zinc-900">
            Nueva Reserva
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
          {/* Resumen de selección */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-zinc-900">Resumen de selección</span>
              <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                {asientosSeleccionados.length} asientos
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {asientosSeleccionados.map((id) => {
                const asiento = asientosDisponibles.find((a) => a.id === id);
                return asiento ? (
                  <span key={id} className="px-2 py-1 text-xs bg-white border border-emerald-200 rounded text-emerald-700">
                    {asiento.numero}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Nombre del titular */}
          <div>
            <label htmlFor="nombreTitular" className="block text-sm font-medium text-zinc-700 mb-1">
              Nombre completo del titular <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                id="nombreTitular"
                value={nombreTitular}
                onChange={(e) => setNombreTitular(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                  errores.nombreTitular ? "border-red-500" : "border-zinc-300"
                }`}
                placeholder="Juan Pérez López"
                disabled={isLoading}
                autoComplete="name"
                aria-invalid={!!errores.nombreTitular}
                aria-describedby={errores.nombreTitular ? "error-nombre" : undefined}
              />
            </div>
            {errores.nombreTitular && (
              <p id="error-nombre" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errores.nombreTitular}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-zinc-700 mb-1">
              Teléfono (10 dígitos) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
              <input
                type="tel"
                id="telefono"
                value={telefono}
                onChange={handleTelefonoChange}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                  errores.telefono ? "border-red-500" : "border-zinc-300"
                }`}
                placeholder="(555) 123-4567"
                disabled={isLoading}
                autoComplete="tel"
                maxLength={14}
                aria-invalid={!!errores.telefono}
                aria-describedby={errores.telefono ? "error-telefono" : undefined}
              />
            </div>
            {errores.telefono && (
              <p id="error-telefono" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errores.telefono}
              </p>
            )}
          </div>

          {/* Lugar de abordaje */}
          <div>
            <label htmlFor="lugarAbordaje" className="block text-sm font-medium text-zinc-700 mb-1">
              Lugar de abordaje en Cruz Grande
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
              <input
                type="text"
                id="lugarAbordaje"
                value={lugarAbordaje}
                onChange={(e) => setLugarAbordaje(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                placeholder="Ej: Plaza principal, Oxxo centro, Mi casa"
                disabled={isLoading}
                autoComplete="address-line1"
              />
            </div>
          </div>

          {/* Anticipo */}
          <div>
            <label htmlFor="anticipo" className="block text-sm font-medium text-zinc-700 mb-1">
              Pago inicial (anticipo)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
              <input
                type="number"
                id="anticipo"
                value={anticipo}
                onChange={(e) => setAnticipo(e.target.value)}
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                  errores.anticipo ? "border-red-500" : "border-zinc-300"
                }`}
                placeholder="0.00"
                disabled={isLoading}
                aria-invalid={!!errores.anticipo}
                aria-describedby={errores.anticipo ? "error-anticipo" : "ayuda-anticipo"}
              />
            </div>
            <p id="ayuda-anticipo" className="mt-1 text-xs text-zinc-500">
              Opcional. Si no se ingresa anticipo, la reserva queda como "Apartado" con saldo pendiente total.
            </p>
            {errores.anticipo && (
              <p id="error-anticipo" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errores.anticipo}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-zinc-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              placeholder="Observaciones especiales..."
              disabled={isLoading}
            />
          </div>

          {/* Cálculo automático */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
            <h3 className="font-medium text-zinc-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              Cálculo automático
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500">Total a pagar</p>
                <p className="font-semibold text-zinc-900">${totalPagar.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Anticipo</p>
                <p className="font-semibold text-emerald-600">${anticipoNum.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Saldo pendiente</p>
                <p className={`font-semibold ${saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ${saldoPendiente.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Estado inicial</p>
                <p className={`font-medium ${saldoPendiente > 0 ? "text-yellow-700" : "text-green-700"}`}>
                  {saldoPendiente > 0 ? "APARTADO" : "LIQUIDADO"}
                </p>
              </div>
            </div>
            {saldoPendiente > 0 && (
              <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg flex items-center gap-1">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                El saldo pendiente se cobrará el día del abordaje.
              </p>
            )}
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
              disabled={isLoading || asientosSeleccionados.length === 0}
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
                  Crear Reserva
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}