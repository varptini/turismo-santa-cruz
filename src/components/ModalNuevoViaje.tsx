"use client";

import { useState, FormEvent } from "react";
import { X, Calendar, DollarSign, Bus, Users, Package, CheckCircle, AlertCircle, MapPin } from "lucide-react";

interface ModalNuevoViajeProps {
  onClose: () => void;
  onSubmit: (data: {
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
  }) => Promise<void>;
  isLoading?: boolean;
}

const CAPACIDADES = [40, 44, 47, 50];

export default function ModalNuevoViaje({ onClose, onSubmit, isLoading = false }: ModalNuevoViajeProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "CORTO" as "CORTO" | "LARGO",
    destino: "",
    fechaSalida: "",
    fechaRegreso: "",
    precioBoleto: "",
    costoRentaCamion: "",
    totalAsientos: 44,
    inclusiones: "",
    notas: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      nuevosErrores.titulo = "El título es obligatorio";
    }

    if (!formData.destino.trim()) {
      nuevosErrores.destino = "El destino es obligatorio";
    }

    if (!formData.fechaSalida) {
      nuevosErrores.fechaSalida = "La fecha de salida es obligatoria";
    }

    if (!formData.fechaRegreso) {
      nuevosErrores.fechaRegreso = "La fecha de regreso es obligatoria";
    }

    if (formData.fechaSalida && formData.fechaRegreso && new Date(formData.fechaRegreso) <= new Date(formData.fechaSalida)) {
      nuevosErrores.fechaRegreso = "La fecha de regreso debe ser posterior a la de salida";
    }

    const precioBoleto = Number(formData.precioBoleto);
    if (!precioBoleto || precioBoleto <= 0) {
      nuevosErrores.precioBoleto = "El precio por boleto debe ser mayor a 0";
    }

    const costoRenta = Number(formData.costoRentaCamion);
    if (!costoRenta || costoRenta < 0) {
      nuevosErrores.costoRentaCamion = "El costo de renta debe ser un número válido";
    }

    if (!CAPACIDADES.includes(formData.totalAsientos)) {
      nuevosErrores.totalAsientos = "Capacidad no válida";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      await onSubmit({
        titulo: formData.titulo.trim(),
        tipo: formData.tipo,
        destino: formData.destino.trim(),
        fechaSalida: formData.fechaSalida,
        fechaRegreso: formData.fechaRegreso,
        precioBoleto: Number(formData.precioBoleto),
        costoRentaCamion: Number(formData.costoRentaCamion),
        totalAsientos: formData.totalAsientos,
        inclusiones: formData.inclusiones.trim() || undefined,
        notas: formData.notas.trim() || undefined,
      });
      onClose();
    } catch (error) {
      setErrores({ submit: error instanceof Error ? error.message : "Error al crear el viaje" });
    }
  };

  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split("T")[0];
  const manana = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-nuevo-viaje-title">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="modal-nuevo-viaje-title" className="text-lg font-semibold text-zinc-900">
            Nuevo Viaje
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
          {/* Información básica */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <Bus className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Información básica
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-zinc-700 mb-1">
                  Título del viaje <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    errores.titulo ? "border-red-500" : "border-zinc-300"
                  }`}
                  placeholder="Ej: Tour a las Grutas de Cacahuamilpa"
                  disabled={isLoading}
                  aria-invalid={!!errores.titulo}
                />
                {errores.titulo && <p className="mt-1 text-sm text-red-600" role="alert">{errores.titulo}</p>}
              </div>

              <div>
                <label htmlFor="destino" className="block text-sm font-medium text-zinc-700 mb-1">
                  Destino <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
                  <input
                    type="text"
                    id="destino"
                    name="destino"
                    value={formData.destino}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                      errores.destino ? "border-red-500" : "border-zinc-300"
                    }`}
                    placeholder="Ej: Taxco, Guerrero"
                    disabled={isLoading}
                    aria-invalid={!!errores.destino}
                  />
                </div>
                {errores.destino && <p className="mt-1 text-sm text-red-600" role="alert">{errores.destino}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-zinc-700 mb-1">
                    Tipo de viaje <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    disabled={isLoading}
                  >
                    <option value="CORTO">Corto (3 días)</option>
                    <option value="LARGO">Largo (7 días)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="totalAsientos" className="block text-sm font-medium text-zinc-700 mb-1">
                    Capacidad del camión <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="totalAsientos"
                    name="totalAsientos"
                    value={formData.totalAsientos}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    disabled={isLoading}
                  >
                    {CAPACIDADES.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap} asientos
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Fechas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaSalida" className="block text-sm font-medium text-zinc-700 mb-1">
                  Fecha de salida <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fechaSalida"
                  name="fechaSalida"
                  value={formData.fechaSalida}
                  onChange={handleChange}
                  min={hoy}
                  className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errores.fechaSalida ? "border-red-500" : "border-zinc-300"
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!errores.fechaSalida}
                />
                {errores.fechaSalida && <p className="mt-1 text-sm text-red-600" role="alert">{errores.fechaSalida}</p>}
              </div>
              <div>
                <label htmlFor="fechaRegreso" className="block text-sm font-medium text-zinc-700 mb-1">
                  Fecha de regreso <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fechaRegreso"
                  name="fechaRegreso"
                  value={formData.fechaRegreso}
                  onChange={handleChange}
                  min={manana}
                  className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errores.fechaRegreso ? "border-red-500" : "border-zinc-300"
                  }`}
                  disabled={isLoading}
                  aria-invalid={!!errores.fechaRegreso}
                />
                {errores.fechaRegreso && <p className="mt-1 text-sm text-red-600" role="alert">{errores.fechaRegreso}</p>}
              </div>
            </div>
          </div>

          {/* Costos */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Costos y precios
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="precioBoleto" className="block text-sm font-medium text-zinc-700 mb-1">
                  Precio por boleto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
                  <input
                    type="number"
                    id="precioBoleto"
                    name="precioBoleto"
                    value={formData.precioBoleto}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                      errores.precioBoleto ? "border-red-500" : "border-zinc-300"
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                    aria-invalid={!!errores.precioBoleto}
                  />
                </div>
                {errores.precioBoleto && <p className="mt-1 text-sm text-red-600" role="alert">{errores.precioBoleto}</p>}
              </div>
              <div>
                <label htmlFor="costoRentaCamion" className="block text-sm font-medium text-zinc-700 mb-1">
                  Costo de renta del autobús <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" aria-hidden="true" />
                  <input
                    type="number"
                    id="costoRentaCamion"
                    name="costoRentaCamion"
                    value={formData.costoRentaCamion}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
                      errores.costoRentaCamion ? "border-red-500" : "border-zinc-300"
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                    aria-invalid={!!errores.costoRentaCamion}
                  />
                </div>
                {errores.costoRentaCamion && <p className="mt-1 text-sm text-red-600" role="alert">{errores.costoRentaCamion}</p>}
              </div>
            </div>
          </div>

          {/* Inclusiones */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" aria-hidden="true" />
              Inclusiones y notas
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="inclusiones" className="block text-sm font-medium text-zinc-700 mb-1">
                  Incluye (hoteles, entradas, comidas, solo transporte, etc.)
                </label>
                <textarea
                  id="inclusiones"
                  name="inclusiones"
                  value={formData.inclusiones}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Ej: Hospedaje 2 noches en hotel 3*, entrada a grutas, desayunos incluidos. Transporte únicamente."
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-zinc-700 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Observaciones internas..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Resumen de ganancia estimada */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <h3 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              Estimación financiera
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500">Ingresos estimados (lleno total)</p>
                <p className="font-semibold text-emerald-600">
                  ${(Number(formData.precioBoleto) * formData.totalAsientos).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Costo de renta</p>
                <p className="font-semibold text-red-600">${Number(formData.costoRentaCamion).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Ganancia estimada</p>
                <p className={`font-semibold ${Number(formData.precioBoleto) * formData.totalAsientos - Number(formData.costoRentaCamion) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  ${(Number(formData.precioBoleto) * formData.totalAsientos - Number(formData.costoRentaCamion)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Punto de equilibrio</p>
                <p className="font-semibold text-zinc-900">
                  {Math.ceil(Number(formData.costoRentaCamion) / (Number(formData.precioBoleto) || 1))} boletos
                </p>
              </div>
            </div>
          </div>

          {/* Error general */}
          {errores.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {errores.submit}
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-zinc-200">
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
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  Crear Viaje
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}