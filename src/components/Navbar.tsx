"use client";

import Link from "next/link";
import { Bus, MapPin, Plus } from "lucide-react";

interface NavbarProps {
  onNuevoViaje?: () => void;
}

export default function Navbar({ onNuevoViaje }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Navegación principal">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" aria-label="Turismo Santa Cruz - Inicio">
              <Bus className="h-8 w-8 text-emerald-600" aria-hidden="true" />
              <span className="text-xl font-bold text-zinc-900">Turismo Santa Cruz</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>Cruz Grande, Gro.</span>
            </div>

            {onNuevoViaje ? (
              <button
                type="button"
                onClick={onNuevoViaje}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors touch-manipulation"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nuevo Viaje
              </button>
            ) : (
              <Link
                href="/?nuevo=true"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors touch-manipulation"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nuevo Viaje
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}