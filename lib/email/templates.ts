import { INVESTMENT_BASE_PATH } from "@/lib/equity-market/investment-brand";

export type EmailJobTemplate = {
  id: string;
  recipient: string;
  category: string;
  templateKey: string;
  templateVersion: string;
  relatedEntityId: string;
  variables: Record<string, unknown>;
};

export type RenderedEmail = {
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://jackhunter.com";
const appSender =
  process.env.RESEND_FROM_EMAIL ?? "Hunter Group <hello@updates.jackhunter.com>";
const capitalSender =
  process.env.RESEND_CAPITAL_FROM_EMAIL ??
  "Equity Market <advisors@noreply.equitymarket.io>";
const replyTo = process.env.RESEND_REPLY_TO ?? "hello@jackhunter.com";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(params: {
  language: "en" | "tr";
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  investmentBrand?: boolean;
}) {
  const investmentName = "Equity Market";
  const brandHeader = params.investmentBrand
    ? `<div style="color:#fff;font-size:16px;font-weight:700;letter-spacing:-.01em">Equity Market</div>
       <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.16);color:#9eabb3;font-size:8px;letter-spacing:.1em;text-transform:uppercase">Powered by <span style="margin-left:7px;color:#e7ecef;font-size:12px;font-weight:700;letter-spacing:.16em">PARVIS</span></div>`
    : "Hunter Group";
  const footer = params.investmentBrand
    ? `${params.language === "tr" ? "Menkul kıymet hizmetleri Parvis Investment Services Inc. aracılığıyla sunulur" : "Securities services through Parvis Investment Services Inc."} · NRD #74000.<br>${investmentName} · ${params.language === "tr" ? "Parvis açıklamaları" : "Parvis disclosures"}`
    : "Questions? Reply to this email or contact hello@jackhunter.com.";
  const html = `<!doctype html>
<html lang="${params.language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f7f5ef;color:#14232d;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(params.eyebrow)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
        <tr><td style="background:#071c2c;padding:28px;color:#d7b86b;font-size:12px;letter-spacing:.16em;text-transform:uppercase">${brandHeader}</td></tr>
        <tr><td style="padding:38px 32px">
          <p style="margin:0 0 12px;color:#7b5c19;font-size:11px;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(params.eyebrow)}</p>
          <h1 style="margin:0 0 18px;font:500 30px Georgia,serif;color:#071c2c">${escapeHtml(params.title)}</h1>
          <p style="margin:0 0 28px;line-height:1.65;color:#465761">${escapeHtml(params.body)}</p>
          <a href="${escapeHtml(params.actionUrl)}" style="display:inline-block;background:#071c2c;color:#fff;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(params.actionLabel)}</a>
        </td></tr>
        <tr><td style="padding:24px 32px;background:#f1f3f4;color:#687780;font-size:12px;line-height:1.6">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `${params.investmentBrand ? `${investmentName}\nPowered by Parvis\n\n` : ""}${params.eyebrow}\n\n${params.title}\n\n${params.body}\n\n${params.actionLabel}: ${params.actionUrl}${params.investmentBrand ? "\n\nSecurities services through Parvis Investment Services Inc. · NRD #74000.\nParvis disclosures" : ""}`;
  return { html, text };
}

export function renderEmailJob(job: EmailJobTemplate): RenderedEmail {
  const language = job.variables.language === "en" ? "en" : "tr";
  if (job.templateKey === "guide-delivery") {
    const guide = job.variables.guide === "satici" ? "satici" : "alici";
    const copy =
      language === "en"
        ? {
            eyebrow: "Your guide is ready",
            title: guide === "alici" ? "Home Buying Guide" : "Home Selling Guide",
            body: "Thanks for your request. Use the secure link below to open the guide you asked for.",
            action: "Open guide",
          }
        : {
            eyebrow: "Rehberiniz hazır",
            title: guide === "alici" ? "Ev Alma Rehberi" : "Ev Satma Rehberi",
            body: "Talebiniz için teşekkür ederiz. İstediğiniz rehberi aşağıdaki güvenli bağlantıdan açabilirsiniz.",
            action: "Rehberi aç",
          };
    const content = shell({
      language,
      eyebrow: copy.eyebrow,
      title: copy.title,
      body: copy.body,
      actionLabel: copy.action,
      actionUrl:
        typeof job.variables.guideUrl === "string"
          ? job.variables.guideUrl
          : `${siteUrl}/guides/${guide === "alici" ? "ev-alma-rehberi.pdf" : "ev-satma-rehberi.pdf"}`,
    });
    return {
      from: appSender,
      replyTo,
      to: job.recipient,
      subject: copy.title,
      ...content,
    };
  }

  const reference = `EM-${job.relatedEntityId.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  const isReadiness = job.templateKey === "readiness-alert";
  const content = shell({
    language: "en",
    eyebrow: "Secure portal notification",
    title: isReadiness ? "New investor-readiness submission" : "New capital intake",
    body: `A new submission (${reference}) is ready for review. Sign in to the protected portal to view the details.`,
    actionLabel: "Open lead inbox",
    actionUrl: `${siteUrl}${INVESTMENT_BASE_PATH}/admin/leads`,
    investmentBrand: true,
  });
  return {
    from: capitalSender,
    replyTo,
    to: job.recipient,
    subject: `New Equity Market intake · ${reference}`,
    ...content,
  };
}
