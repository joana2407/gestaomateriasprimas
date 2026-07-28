import { publicProcedure, router } from "../_core/trpc";
import { getDashboardStats, getAuditLog } from "../db";

export const dashboardRouter = router({
  stats: publicProcedure.query(async () => getDashboardStats()),
  auditLog: publicProcedure.query(async () => getAuditLog()),
});

