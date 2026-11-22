/**
 * Utilidades para formateo y generación de enlaces de WhatsApp para Turismo Santa Cruz
 */

/**
 * Normaliza un número telefónico al formato internacional de WhatsApp para México (+52).
 * Maneja entradas de 10 dígitos (nacional), 12 dígitos (52 + 10 dígitos),
 * o 13 dígitos (521 + 10 dígitos formato legacy móvil WhatsApp),
 * eliminando cualquier caracter no numérico y evitando duplicación del prefijo "52".
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // Si tiene formato legacy de México móvil en WhatsApp con "1": 521XXXXXXXXXX (13 dígitos)
  if (digits.length === 13 && digits.startsWith("521")) {
    return `52${digits.slice(3)}`;
  }

  // Si ya tiene el prefijo 52 con 10 dígitos (12 dígitos total, ej. 527451002233)
  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  // Si son 10 dígitos estándar de México (ej. 7451002233)
  if (digits.length === 10) {
    return `52${digits}`;
  }

  // Si ya empieza con 52
  if (digits.startsWith("52")) {
    return digits;
  }

  // Fallback: anteponer 52
  return `52${digits}`;
}

export interface DetalleReciboWhatsApp {
  viajeTitulo: string;
  viajeDestino: string;
  viajeFechaSalida: Date | string;
  nombreTitular: string;
  asientosNumeros: number[];
  totalPagar: number;
  totalAbonado: number;
  saldoPendiente: number;
  lugarAbordaje?: string | null;
  abonos?: Array<{
    monto: number;
    metodo: string;
    fecha: Date | string;
    comprobanteRef?: string | null;
  }>;
}

/**
 * Genera la URL completa wa.me con el mensaje de recibo codificado en URI.
 */
export function buildWhatsAppReceiptUrl(phone: string, detalle: DetalleReciboWhatsApp): string {
  const cleanPhone = formatWhatsAppPhone(phone);

  const fechaFormateada = new Date(detalle.viajeFechaSalida).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let mensaje =
    `🚌 *Turismo Santa Cruz - Recibo de Pago*\n\n` +
    `📋 *Viaje:* ${detalle.viajeTitulo} - ${detalle.viajeDestino}\n` +
    `📅 *Salida:* ${fechaFormateada}\n` +
    `👤 *Titular:* ${detalle.nombreTitular}\n` +
    `💺 *Asientos:* ${detalle.asientosNumeros.join(", ")}\n` +
    `💰 *Total:* $${detalle.totalPagar.toFixed(2)}\n` +
    `✅ *Abonado:* $${detalle.totalAbonado.toFixed(2)}\n` +
    `⏳ *Saldo pendiente:* $${detalle.saldoPendiente.toFixed(2)}\n` +
    `📍 *Abordaje:* ${detalle.lugarAbordaje || "Cruz Grande, Gro."}`;

  if (detalle.abonos && detalle.abonos.length > 0) {
    mensaje += `\n\n*Detalle de abonos:*\n` +
      detalle.abonos
        .map((a) => {
          const f = new Date(a.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
          return `• $${a.monto.toFixed(2)} - ${a.metodo} - ${f}${a.comprobanteRef ? ` (Ref: ${a.comprobanteRef})` : ""}`;
        })
        .join("\n");
  }

  mensaje += `\n\n¡Gracias por viajar con nosotros! 🚌`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
}
