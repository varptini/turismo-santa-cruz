import { describe, it, expect } from "vitest";
import { formatWhatsAppPhone } from "../lib/whatsapp";

describe("WhatsApp Phone Formatter & Link Generator", () => {
  it("normaliza números locales de 10 dígitos anteponiendo el código de país 52", () => {
    const formatted = formatWhatsAppPhone("7451234567");
    expect(formatted).toBe("527451234567");
  });

  it("limpia caracteres no numéricos como guiones, espacios y paréntesis", () => {
    const formatted = formatWhatsAppPhone("(745) 123-4567");
    expect(formatted).toBe("527451234567");
  });

  it("respeta números que ya incluyen el código de país 52", () => {
    const formatted = formatWhatsAppPhone("+52 745 123 4567");
    expect(formatted).toBe("527451234567");
  });

  it("elimina el dígito móvil obsoleto '1' en formato +52 1...", () => {
    const formatted = formatWhatsAppPhone("+52 1 745 123 4567");
    expect(formatted).toBe("527451234567");
  });

  it("maneja números vacíos o inválidos retornando cadena limpia", () => {
    const formatted = formatWhatsAppPhone("");
    expect(formatted).toBe("");
  });
});
