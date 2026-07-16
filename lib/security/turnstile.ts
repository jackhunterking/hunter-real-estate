import "server-only";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(params: {
  token?: string;
  remoteIp?: string | null;
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: process.env.NODE_ENV !== "production", reason: "not-configured" };
  }
  if (!params.token) return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams({
    secret,
    response: params.token,
  });
  if (params.remoteIp) body.set("remoteip", params.remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    const result = (await response.json()) as TurnstileResponse;
    return {
      ok: response.ok && result.success,
      reason: result["error-codes"]?.join(",") ?? "verification-failed",
    };
  } catch {
    return { ok: false, reason: "verification-unavailable" };
  }
}
