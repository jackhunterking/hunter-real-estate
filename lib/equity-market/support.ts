export const PORTAL_WHATSAPP_NUMBER = "16473913311";

export function buildHncWhatsAppUrl(context?: string) {
  const message = context
    ? `Equity Market: ${context}`
    : "Equity Market hakkında görüşmek istiyorum.";
  return `https://wa.me/${PORTAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Live chat is Intercom, mounted app-wide by components/intercom/IntercomMessenger.tsx
// and configured in lib/intercom/config.ts. The unused HNC_CHAT_* scaffold that
// used to sit here was removed so there is a single answer to "is chat on?".
