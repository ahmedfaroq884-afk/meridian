import { MessageCircle } from "lucide-react";
import type { Language } from "../lib/types";
import { t } from "../lib/i18n";

export function WhatsAppWidget({ phoneNumber, language }: { phoneNumber: unknown; language: Language }) {
  if (typeof phoneNumber !== "string") return null;
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return <a
    className="whatsapp-widget"
    href={`https://wa.me/${digits}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={t(language, "whatsappChat")}
    title={t(language, "whatsappChat")}
  >
    <MessageCircle size={24} aria-hidden="true"/>
  </a>;
}
