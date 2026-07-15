import { NorthShell } from "@/components/capital/north/NorthShell";
import { ClientProvider } from "@/components/capital/north/ClientProvider";

export default function HunterNorthPortalLayout({ children }: { children: React.ReactNode }) {
  return <ClientProvider><NorthShell>{children}</NorthShell></ClientProvider>;
}
