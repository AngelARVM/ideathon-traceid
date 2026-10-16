import type { Metadata } from "next";
import { LoginView } from "@/views/LoginView";

export const metadata: Metadata = { title: "Ingresar" };

export default function Page() {
  return <LoginView />;
}
