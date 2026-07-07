import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

const router = Router();

const LogSchema = z.object({
  action: z.string().min(1).max(100),
  target_id: z.string().nullable().optional(),
  target_type: z.string().nullable().optional(),
});

// Log an activity (any logged-in user)
router.post("/log", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = LogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const { action, target_id, target_type } = parsed.data;

  await prisma.activityLog.create({
    data: {
      email: req.user!.email,
      action,
      targetId: target_id || null,
      targetType: target_type || null,
    },
  });

  res.json({ ok: true });
});

// Admin: view/export logs
router.get("/", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const format = (req.query.format as string) || "json";
  const limitParam = parseInt((req.query.limit as string) || "100");
  const limit = Math.min(limitParam, 10000);

  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: format === "csv" ? 50000 : limit,
  });

  const solutionIds = Array.from(
    new Set(rows.filter((r) => r.targetType === "solution" && r.targetId).map((r) => r.targetId as string))
  );
  const collateralIds = Array.from(
    new Set(rows.filter((r) => r.targetType === "collateral" && r.targetId).map((r) => r.targetId as string))
  );

  const nameMap = new Map<string, string>();
  if (solutionIds.length) {
    const sols = await prisma.solution.findMany({ where: { id: { in: solutionIds } }, select: { id: true, title: true } });
    sols.forEach((s) => nameMap.set(`solution:${s.id}`, s.title));
  }
  if (collateralIds.length) {
    const cols = await prisma.collateral.findMany({ where: { id: { in: collateralIds } }, select: { id: true, title: true } });
    cols.forEach((c) => nameMap.set(`collateral:${c.id}`, c.title));
  }

  const enriched = rows.map((r) => ({
    id: r.id,
    email: r.email,
    action: r.action,
    target_id: r.targetId,
    target_type: r.targetType,
    target_name: r.targetId && r.targetType ? nameMap.get(`${r.targetType}:${r.targetId}`) ?? null : null,
    created_at: r.createdAt,
  }));

  if (format === "csv") {
    const header = "id,email,action,target_id,target_type,target_name,created_at\n";
    const csvRows = enriched
      .map((r) =>
        [r.id, r.email, r.action, r.target_id ?? "", r.target_type ?? "", r.target_name ?? "", r.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="activity-logs-${new Date().toISOString()}.csv"`);
    return res.send(header + csvRows);
  }

  res.json({ logs: enriched });
});

export default router;