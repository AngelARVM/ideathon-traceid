import type { ReactNode } from "react";
import { DemandShell } from "@/app/demands/_components/DemandShell";

export default function MyDemandsLayout({ children }: { children: ReactNode }) {
  return <DemandShell>{children}</DemandShell>;
}
