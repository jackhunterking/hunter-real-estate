"use client";

/**
 * Users & roles — the platform's first user directory, and the only place
 * `master_admin` can be granted or removed without opening SQL.
 *
 * The write path is the existing /api/portal-platform-roles route, which has been
 * in the codebase since the role system was built and had never had a caller.
 * The two ways to lock everyone out — removing the last admin, and revoking your
 * own role — are refused by `private.set_platform_role` server-side. The button
 * states below mirror those rules so the refusal is visible before you click,
 * but the server is what enforces them.
 */
import { useMemo, useState } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import type { AdminUserRow } from "@/lib/equity-market/admin-server";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { pick } from "@/lib/i18n/localize";
import { usePortalAccess } from "../PortalAccessProvider";
import { Panel, shortDate } from "../PortalUI";

const COPY = {
  en: {
    title: "Users & roles",
    description: "Everyone with an account, their verification and partner state, and who holds platform administrator.",
    search: "Search by name or email",
    none: "No users yet.",
    admin: "Platform admin", investor: "Investor", partner: "Partner",
    grant: "Make admin", revoke: "Remove admin",
    you: "You", lastAdmin: "The only admin", unverified: "Email unverified", suspended: "Suspended",
    lastSeen: "Last signed in", never: "Never", joined: "Joined",
    error: "The role change was not applied.",
    selfHint: "You cannot remove your own admin role.",
    lastHint: "At least one platform administrator must remain.",
  },
  tr: {
    title: "Kullanıcılar ve roller",
    description: "Hesabı olan herkes, doğrulama ve iş ortağı durumları ve platform yöneticiliğini kimin taşıdığı.",
    search: "Ada veya e-postaya göre ara",
    none: "Henüz kullanıcı yok.",
    admin: "Platform yöneticisi", investor: "Yatırımcı", partner: "İş ortağı",
    grant: "Yönetici yap", revoke: "Yöneticiliği kaldır",
    you: "Siz", lastAdmin: "Tek yönetici", unverified: "E-posta doğrulanmadı", suspended: "Askıya alınmış",
    lastSeen: "Son giriş", never: "Hiç", joined: "Katılım",
    error: "Rol değişikliği uygulanamadı.",
    selfHint: "Kendi yöneticilik rolünüzü kaldıramazsınız.",
    lastHint: "En az bir platform yöneticisi kalmalıdır.",
  },
} as const;

export function UsersAndRoles({ users }: { users: AdminUserRow[] }) {
  const { lang } = useLang();
  const { currentUser } = usePortalAccess();
  const c = pick(COPY, lang);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const adminCount = useMemo(
    () => users.filter((user) => user.platformRoles.includes("master_admin")).length,
    [users],
  );
  const visible = useMemo(() => {
    const needle = query.toLocaleLowerCase();
    return users.filter((user) => `${user.displayName} ${user.email}`.toLocaleLowerCase().includes(needle));
  }, [users, query]);

  async function toggleAdmin(user: AdminUserRow, enabled: boolean) {
    setBusyId(user.userId);
    setError(false);
    const response = await fetch("/api/portal-platform-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, role: "master_admin", enabled }),
    });
    setBusyId(null);
    if (!response.ok) { setError(true); return; }
    window.location.reload();
  }

  return <section>
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-[#18384e]">{c.title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#657681]">{c.description}</p>
      </div>
      {users.length > 0 && (
        <label className="relative block min-w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81909a]" />
          <span className="sr-only">{c.search}</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search}
            className="h-10 w-full rounded-md border border-[#d5dde2] bg-white pl-9 pr-3 text-sm" />
        </label>
      )}
    </div>

    {error && <p role="alert" className="mb-3 rounded-md bg-[#fbecea] px-3 py-2 text-sm font-semibold text-[#a24d43]">{c.error}</p>}

    <Panel className="overflow-hidden">
      <div className="divide-y divide-[#e8ecee]">
        {visible.map((user) => {
          const isAdmin = user.platformRoles.includes("master_admin");
          const isSelf = user.userId === currentUser.id;
          const isLastAdmin = isAdmin && adminCount <= 1;
          const blocked = isAdmin && (isSelf || isLastAdmin);
          return (
            <div key={user.userId} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1c3546]">
                  {user.displayName}
                  {isSelf && <span className="ml-2 rounded bg-[#eef2f4] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5f6e78]">{c.you}</span>}
                </p>
                <p className="mt-1 truncate text-xs text-[#6b7982]">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {isAdmin && <Tag tone="admin">{c.admin}</Tag>}
                  {user.accountIntent === "investor" && <Tag>{c.investor}</Tag>}
                  {user.partnerIsActive && <Tag>{c.partner}</Tag>}
                  {!user.emailVerified && <Tag tone="warn">{c.unverified}</Tag>}
                  {user.accountStatus !== "active" && <Tag tone="bad">{c.suspended}</Tag>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right text-[11px] text-[#87929a]">
                  <p>{c.lastSeen}: {user.lastSignInAt ? shortDate(user.lastSignInAt.slice(0, 10), lang) : c.never}</p>
                  <p>{c.joined}: {shortDate(user.createdAt.slice(0, 10), lang)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled={blocked || busyId === user.userId}
                    onClick={() => toggleAdmin(user, !isAdmin)}
                    className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold disabled:opacity-45 ${
                      isAdmin ? "border border-[#e1c8c4] bg-white text-[#a24d43]" : "bg-[#0a2d46] text-white"
                    }`}
                  >
                    {isAdmin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                    {isAdmin ? c.revoke : c.grant}
                  </button>
                  {blocked && (
                    <span className="text-[10px] text-[#8a6d24]">{isSelf ? c.selfHint : c.lastHint}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {!visible.length && <div className="p-12 text-center text-sm text-[#697680]">{c.none}</div>}
      </div>
    </Panel>
  </section>;
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "admin" | "warn" | "bad" }) {
  const tones = {
    neutral: "bg-[#eef2f4] text-[#5f6e78]",
    admin: "bg-[#e8f0f6] text-[#0a4b72]",
    warn: "bg-[#fdf3e0] text-[#8a6d24]",
    bad: "bg-[#fbecea] text-[#a24d43]",
  } as const;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}
