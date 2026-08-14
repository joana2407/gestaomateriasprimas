import { qualidadeProcedure, router } from "../_core/trpc";
import { getDashboardStats, getAuditLog } from "../db";

export const dashboardRouter = router({
  stats: qualidadeProcedure.query(async () => getDashboardStats()),
  auditLog: qualidadeProcedure.query(async () => getAuditLog()),
});
