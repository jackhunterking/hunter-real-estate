import { Resend } from "resend";

/**
 * Email delivery via Resend
 *
 * Setup:
 * 1. Sign up at resend.com
 * 2. Add and verify the domain jackhunter.com (DNS records: SPF, DKIM)
 * 3. Create an API key → add to .env as RESEND_API_KEY
 * 4. Set RESEND_FROM_EMAIL like: "Jack Hunter <hello@jackhunter.com>"
 */

type GuideType = "alici" | "satici";

const GUIDE_CONFIG: Record<
  GuideType,
  { title: string; filename: string; url: string }
> = {
  alici: {
    title: "Ev Alma Rehberi",
    filename: "ev-alma-rehberi.pdf",
    url: "/guides/ev-alma-rehberi.pdf",
  },
  satici: {
    title: "Ev Satma Rehberi",
    filename: "ev-satma-rehberi.pdf",
    url: "/guides/ev-satma-rehberi.pdf",
  },
};

export async function sendGuideEmail(params: {
  email: string;
  guide: GuideType;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Jack Hunter <hello@jackhunter.com>";
  const replyTo = process.env.RESEND_REPLY_TO ?? "hello@jackhunter.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jackhunter.com";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { ok: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);
  const config = GUIDE_CONFIG[params.guide];
  const guideAbsoluteUrl = `${siteUrl}${config.url}`;

  try {
    const result = await resend.emails.send({
      from,
      to: params.email,
      replyTo,
      subject: `${config.title}, Sizin için hazırladık`,
      html: buildEmailHtml({
        guideTitle: config.title,
        guideUrl: guideAbsoluteUrl,
        siteUrl,
      }),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

export async function sendCapitalIntakeNotification(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  country: string;
  meetingPreference: string;
  preferredLanguage: string;
  investableRange: string;
  timeline: string;
  objective: string;
  riskComfort: string;
  investorStatus: string;
  interestedProducts: string[];
  message?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Jack Hunter <hello@jackhunter.com>";
  const to = process.env.CAPITAL_INTAKE_TO_EMAIL ?? process.env.RESEND_REPLY_TO ?? "hello@jackhunter.com";
  const replyTo = params.email;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping capital intake notification");
    return { ok: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo,
      subject: `Hunter North Capital intake: ${params.firstName} ${params.lastName}`,
      html: buildCapitalIntakeHtml(params),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

function buildCapitalIntakeHtml(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  country: string;
  meetingPreference: string;
  preferredLanguage: string;
  investableRange: string;
  timeline: string;
  objective: string;
  riskComfort: string;
  investorStatus: string;
  interestedProducts: string[];
  message?: string;
}): string {
  const rows = [
    ["Name", `${params.firstName} ${params.lastName}`],
    ["Email", params.email],
    ["Phone", params.phone ?? ""],
    ["Location", `${params.city}, ${params.country}`],
    ["Meeting preference", params.meetingPreference],
    ["Preferred language", params.preferredLanguage],
    ["Investable range", params.investableRange],
    ["Timeline", params.timeline],
    ["Objective", params.objective],
    ["Risk comfort", params.riskComfort],
    ["Investor status", params.investorStatus],
    ["Products", params.interestedProducts.join(", ")],
    ["Message", params.message ?? ""],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
  <h1 style="font-size:24px;">Hunter North Capital Intake</h1>
  <table cellpadding="8" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:720px;">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="border:1px solid #e5e7eb;font-weight:700;width:210px;">${label}</td>
          <td style="border:1px solid #e5e7eb;">${value || "-"}</td>
        </tr>`
      )
      .join("")}
  </table>
  <h2 style="font-size:18px;margin-top:28px;">Internal checklist</h2>
  <ul>
    <li>KYC complete: pending</li>
    <li>KYP/product match reviewed: pending</li>
    <li>Suitability reviewed: pending</li>
    <li>Risk acknowledgement received: yes</li>
    <li>Offering documents delivered: pending</li>
    <li>Subscription status tracked: pending</li>
  </ul>
</body>
</html>`;
}

function buildEmailHtml({
  guideTitle,
  guideUrl,
  siteUrl,
}: {
  guideTitle: string;
  guideUrl: string;
  siteUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${guideTitle}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;">

          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:32px;text-align:center;">
              <img src="${siteUrl}/logos/HUNTER_Brandmark_Gold.png" alt="Hunter Group Real Estate" height="40" style="height:40px;width:40px;display:inline-block;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#ebc76b;font-weight:600;">Rehberiniz Hazır</p>
              <h1 style="margin:0 0 24px;font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:500;line-height:1.1;color:#000000;letter-spacing:-0.01em;">
                ${guideTitle}
              </h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#0a0a0a;">
                Merhaba,
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#0a0a0a;">
                İlginiz için teşekkür ederiz. Sizin için hazırladığımız rehbere aşağıdaki bağlantıdan ulaşabilirsiniz.
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 40px;">
                <tr>
                  <td style="background:#000000;">
                    <a href="${guideUrl}" target="_blank" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Rehberi İndir
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6b6b6b;">
                Sorularınız olursa cevap vermekten mutluluk duyarız. Bu e-postaya doğrudan yanıt verebilirsiniz.
              </p>

              <p style="margin:32px 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:18px;color:#0a0a0a;">
                Jack &amp; Tara Hunter
              </p>
              <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b;">
                RE/MAX Hallmark
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#000000;padding:32px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
              <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.5);">
                <a href="mailto:hello@jackhunter.com" style="color:#ebc76b;text-decoration:none;">hello@jackhunter.com</a>
                &nbsp;&middot;&nbsp;
                <a href="${siteUrl}" style="color:rgba(255,255,255,0.5);text-decoration:none;">jackhunter.com</a>
              </p>
              <p style="margin:16px 0 0;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">
                &copy; 2026 Hunter Group Real Estate
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
