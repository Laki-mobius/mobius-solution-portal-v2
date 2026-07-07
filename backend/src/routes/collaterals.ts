import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

const router = Router();

// Public: list all collaterals
router.get("/", async (_req, res) => {
  const collaterals = await prisma.collateral.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const shaped = collaterals.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    file_url: c.fileUrl,
    linked_solution_id: c.linkedSolutionId,
    created_at: c.createdAt,
  }));

  res.json(shaped);
});

const CollateralSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["video", "deck", "document"]),
  file_url: z.string().min(1),
  linked_solution_id: z.string().nullable().optional(),
});

// Admin: create collateral
router.post("/", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = CollateralSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const created = await prisma.collateral.create({
    data: {
      title: d.title.trim(),
      type: d.type,
      fileUrl: d.file_url,
      linkedSolutionId: d.linked_solution_id || null,
    },
  });

  res.json({ ok: true, id: created.id });
});

// Admin: update collateral
router.put("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = CollateralSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  try {
    await prisma.collateral.update({
      where: { id: req.params.id as string },
      data: {
        title: d.title.trim(),
        type: d.type,
        fileUrl: d.file_url,
        linkedSolutionId: d.linked_solution_id || null,
      },
    });
    res.json({ ok: true, id: req.params.id });
  } catch {
    res.status(404).json({ error: "Collateral not found" });
  }
});

// Admin: delete collateral
router.delete("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    await prisma.collateral.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Collateral not found" });
  }
});

// Admin: move collateral up/down in order
router.post("/:id/move", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { direction } = req.body as { direction?: "up" | "down" };
  if (direction !== "up" && direction !== "down") {
    return res.status(400).json({ error: "direction must be 'up' or 'down'" });
  }

  const all = await prisma.collateral.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = all.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Collateral not found" });

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) {
    return res.json({ ok: true });
  }

  [all[index], all[swapWith]] = [all[swapWith], all[index]];

  await prisma.$transaction(
    all.map((c, i) => prisma.collateral.update({ where: { id: c.id }, data: { sortOrder: i } }))
  );

  res.json({ ok: true });
});

export default router;