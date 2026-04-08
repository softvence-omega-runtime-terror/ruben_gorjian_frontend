import { ReactNode } from "react";
import { DashboardLayout as DashboardLayoutClient } from "@/components/dashboard/DashboardLayout";

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
