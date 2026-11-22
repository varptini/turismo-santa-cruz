"use client";

import { useState, FormEvent } from "react";
import { Plus, Trash2, MapPin, CheckCircle, XCircle, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

export type TipoParada = "TURISTICO" | "BALNEARIO" | "GRUTAS" | "MERCADO" | "HOTEL" | "COMIDA" | "OTRO";

export interface Parada {
  id: string;
  orden: number;
  lugar: string;
  tipo: TipoParada;
  descripcion?: string | null;
  incluyeCosto: boolean;
}

interface ItinerarioViewProps {
  viajeId: string;
  paradas: Parada[];
  onAddParada: (data: Omit<Parada, "id">) => Promise<void>;
  onDeleteParada: (paradaId: string) => Promise<void>;
  isLoading?: boolean;
}

const TIPO_PARADA_CONFIG: Record<TipoParada, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  TURISTICO: { label: "Turístico", icon: <MapPin className="h-3 w-3" />, color: "text-blue-700", bgColor: "bg-blue-100" },
  BALNEARIO: { label: "Balneario", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, color: "text-cyan-700", bgColor: "bg-cyan-100" },
  GRUTAS: { label: "Grutas", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>, color: "text-amber-700", bgColor: "bg-amber-100" },
  MERCADO: { label: "Mercado", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>, color: "text-purple-700", bgColor: "bg-purple-100" },
  HOTEL: { label: "Hotel", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, color: "text-indigo-700", bgColor: "bg-indigo-100" },
  COMIDA: { label: "Comida", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, color: "text-orange-700", bgColor: "bg-orange-100" },
  OTRO: { label: "Otro", icon: <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "text-zinc-700", bgColor: "bg-zinc-100" },
};

const TIPO_OPCIONES: Array<{ value: TipoParada; label: string }> = [
  { value: "TURISTICO", label: "🏛️ Turístico" },
  { value: "BALNEARIO", label: "🏊 Balneario" },
  { value: "GRUTAS", label: "🕳️ Grutas" },
  { value: "MERCADO", label: "🛍️ Mercado" },
  { value: "HOTEL", label: "🏨 Hotel" },
  { value: "COMIDA", label: "🍽️ Comida" },
  { value: "OTRO", label: "📍 Otro" },
];

export default function ItinerarioView({ viajeId, paradas, onAddParada, onDeleteParada, isLoading = false }: ItinerarioViewProps) {
  const [showForm, setShowForm] = useState(false);
  const siguienteOrden = paradas.length > 0 ? Math.max(...paradas.map((p) => p.orden)) + 1 : 1;
  const [formData, setFormData] = useState({
    orden: siguienteOrden,
    lugar: "",
    tipo: "TURISTICO" as TipoParada,
    descripcion: "",
    incluyeCosto: false,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: "" }));
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!formData.lugar.trim()) nuevosErrores.lugar = "El lugar es obligatorio";
    if (!formData.orden || formData.orden < 1) nuevosErrores.orden = "El orden debe ser un número positivo";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      await onAddParada({
        orden: formData.orden,
        lugar: formData.lugar.trim(),
        tipo: formData.tipo,
        descripcion: formData.descripcion.trim() || undefined,
        incluyeCosto: formData.incluyeCosto,
      });
      setFormData({ ...formData, orden: formData.orden + 1, lugar: "", descripcion: "", incluyeCosto: false });
      setShowForm(false);
    } catch (error) {
      setErrores({ submit: error instanceof Error ? error.message : "Error al agregar parada" });
    }
  };

  const handleDelete = async (paradaId: string) => {
    if (!confirm("¿Eliminar esta parada del itinerario?")) return;
    try {
      await onDeleteParada(paradaId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar parada");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Ordenar paradas por orden
  const paradasOrdenadas = [...paradas].sort((a, b) => a.orden - b.orden);

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          Itinerario de Paradas
        </h3>
        <button
          type="button"
          onClick={() => {
            if (!showForm) {
              setFormData((prev) => ({ ...prev, orden: siguienteOrden }));
            }
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation flex items-center gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar Parada
        </button>
      </div>

      {/* Formulario para agregar parada */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4 animate-slide-down">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="orden" className="block text-sm font-medium text-zinc-700 mb-1">
                Orden <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="orden"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errores.orden ? "border-red-500" : "border-zinc-300"
                }`}
                disabled={isLoading}
              />
              {errores.orden && <p className="mt-1 text-sm text-red-600">{errores.orden}</p>}
            </div>
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-zinc-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isLoading}
              >
                {TIPO_OPCIONES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="lugar" className="block text-sm font-medium text-zinc-700 mb-1">
              Lugar / Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lugar"
              name="lugar"
              value={formData.lugar}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errores.lugar ? "border-red-500" : "border-zinc-300"
              }`}
              placeholder="Ej: Balneario El Salto, Grutas de Cacahuamilpa, Hotel Posada..."
              disabled={isLoading}
            />
            {errores.lugar && <p className="mt-1 text-sm text-red-600">{errores.lugar}</p>}
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-zinc-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Detalles de la actividad, horarios, qué llevar..."
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="incluyeCosto"
                checked={formData.incluyeCosto}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 border-zinc-300 rounded focus:ring-emerald-500"
                disabled={isLoading}
              />
              <span className="text-sm text-zinc-700">Incluido en el costo del viaje</span>
            </label>
          </div>

          {errores.submit && (
            <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
              <XCircle className="h-4 w-4" />
              {errores.submit}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-zinc-300 rounded-lg font-medium text-zinc-700 hover:bg-zinc-100 transition-colors touch-manipulation"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors touch-manipulation"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Agregar Parada"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de paradas */}
      <div className="space-y-2">
        {paradasOrdenadas.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl">
            <MapPin className="h-12 w-12 text-zinc-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-zinc-500">No hay paradas registradas</p>
            <p className="text-sm text-zinc-400 mt-1">Agrega la primera parada del itinerario</p>
          </div>
        ) : (
          paradasOrdenadas.map((parada) => {
            const config = TIPO_PARADA_CONFIG[parada.tipo];
            const isExpanded = expandedId === parada.id;

            return (
              <div
                key={parada.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(parada.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left"
                  aria-expanded={isExpanded}
                >
                  <GripVertical className="h-5 w-5 text-zinc-300 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bgColor }}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900 truncate">{parada.lugar}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${config.bgColor} ${config.color} border-transparent`}>
                        {config.label}
                      </span>
                      {parada.incluyeCosto && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                          Incluido
                        </span>
                      )}
                      <span className="text-xs text-zinc-500 font-mono">Orden: {parada.orden}</span>
                    </div>
                    {parada.descripcion && (
                      <p className="text-sm text-zinc-500 mt-1 truncate">{parada.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(parada.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                      aria-label={`Eliminar parada ${parada.lugar}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-zinc-100 bg-zinc-50 animate-slide-down">
                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-zinc-500">Tipo</p>
                        <p className="font-medium text-zinc-900">{config.label}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Orden</p>
                        <p className="font-medium text-zinc-900">{parada.orden}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Incluido en costo</p>
                        <p className="font-medium text-zinc-900">{parada.incluyeCosto ? "Sí" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">ID</p>
                        <p className="font-mono text-xs text-zinc-500">{parada.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    {parada.descripcion && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-zinc-200">
                        <p className="text-zinc-500 text-sm">Descripción completa:</p>
                        <p className="text-zinc-900 text-sm mt-1 whitespace-pre-wrap">{parada.descripcion}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}