import { apiFetch } from "@/lib/api";
import type { DashboardResumen } from "@/types/dashboard";

export function obtenerResumenDashboard(periodo: number): Promise<DashboardResumen> {
  return apiFetch<DashboardResumen>(`/admin/dashboard/resumen?periodo=${periodo}`);
}
