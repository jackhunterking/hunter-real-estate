export const HNC_WHATSAPP_NUMBER = "16473913311";

export function buildHncWhatsAppUrl(context?: string) {
  const message = context
    ? `Hunter North Capital: ${context}`
    : "Hunter North Capital hakkında görüşmek istiyorum.";
  return `https://wa.me/${HNC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export type HncChatProvider = "disabled" | "custom";

export const HNC_CHAT_PROVIDER: HncChatProvider =
  process.env.NEXT_PUBLIC_HNC_CHAT_PROVIDER === "custom" ? "custom" : "disabled";

export const HNC_CHAT_WIDGET_ID =
  process.env.NEXT_PUBLIC_HNC_CHAT_WIDGET_ID?.trim() ?? "";

export const HNC_CHAT_ENABLED =
  HNC_CHAT_PROVIDER !== "disabled" && Boolean(HNC_CHAT_WIDGET_ID);
