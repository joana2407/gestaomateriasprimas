import { consultaGlobalProcedure, router } from "../_core/trpc";
import { getDashboardStats, getAuditLog } from "../db";

export const dashboardRouter = router({
  stats: consultaGlobalProcedure.query(async () => getDashboardStats()),
  auditLog: consultaGlobalProcedure.query(async () => getAuditLog()),
});
