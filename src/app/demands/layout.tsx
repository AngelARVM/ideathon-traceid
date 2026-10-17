import type { ReactNode } from "react";
import { DemandShell } from "./_components/DemandShell";

export default function DemandsLayout({ children }: { children: ReactNode }) {
  return <DemandShell>{children}</DemandShell>;
}
