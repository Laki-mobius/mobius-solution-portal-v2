import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { encryptCredential } from "../lib/crypto";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

const router = Router();

// Public: list non-archived solutions (mirrors Supabase `solutions_public` view)
router.get("/", async (_req, res) => {
  const solutions = await prisma.solution.findMany({
    where: { status: { not: "archived" } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const shaped = solutions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    icon_url: s.iconUrl,
    thumbnail_url: s.thumbnailUrl,
    target_url: s.targetUrl,
    solution_type: s.solutionType,
    practice: s.practice,
    status: s.status,
    upcoming_eta: s.upcomingEta,
    default_username: s.defaultUsername,
    credentials_note: s.credentialsNote,
    has_credentials: !!s.defaultPasswordEncrypted || !!s.defaultUsername,
    created_at: s.createdAt,
  }));

  res.json(shaped);
});

const SolutionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  icon_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  target_url: z.string().min(1).max(2000),
  solution_type: z.enum(["internal", "external"]),
  practice: z.string().max(100).nullable().optional(),
  status: z.enum(["live", "upcoming", "archived"]).default("live"),
  upcoming_eta: z.string().nullable().optional(),
  default_username: z.string().max(200).nullable().optional(),
  default_password: z.string().max(500).nullable().optional(),
  credentials_note: z.string().max(1000).nullable().optional(),
  clear_password: z.boolean().optional(),
});

// Admin: create solution
router.post("/", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = SolutionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const created = await prisma.solution.create({
    data: {
      title: d.title.trim(),
      description: d.description ?? "",
      iconUrl: d.icon_url || null,
      thumbnailUrl: d.thumbnail_url || null,
      targetUrl: d.target_url.trim(),
      solutionType: d.solution_type,
      practice: d.practice?.trim() || null,
      status: d.status,
      upcomingEta: d.upcoming_eta ? new Date(d.upcoming_eta) : null,
      defaultUsername: d.default_username?.trim() || null,
      credentialsNote: d.credentials_note?.trim() || null,
      defaultPasswordEncrypted:
        d.default_password && d.default_password.length > 0
          ? encryptCredential(d.default_password)
          : null,
    },
  });

  res.json({ ok: true, id: created.id });
});

// Admin: update solution
router.put("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = SolutionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;

  const data: any = {
    title: d.title.trim(),
    description: d.description ?? "",
    iconUrl: d.icon_url || null,
    thumbnailUrl: d.thumbnail_url || null,
    targetUrl: d.target_url.trim(),
    solutionType: d.solution_type,
    practice: d.practice?.trim() || null,
    status: d.status,
    upcomingEta: d.upcoming_eta ? new Date(d.upcoming_eta) : null,
    defaultUsername: d.default_username?.trim() || null,
    credentialsNote: d.credentials_note?.trim() || null,
  };

  if (d.clear_password) {
    data.defaultPasswordEncrypted = null;
  } else if (d.default_password && d.default_password.length > 0) {
    data.defaultPasswordEncrypted = encryptCredential(d.default_password);
  }

  try {
    await prisma.solution.update({ where: { id: req.params.id as string }, data });
    res.json({ ok: true, id: req.params.id });
  } catch {
    res.status(404).json({ error: "Solution not found" });
  }
});

// Admin: delete solution
router.delete("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  try {
    await prisma.solution.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Solution not found" });
  }
});

// Admin: move solution up/down in order
router.post("/:id/move", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { direction } = req.body as { direction?: "up" | "down" };
  if (direction !== "up" && direction !== "down") {
    return res.status(400).json({ error: "direction must be 'up' or 'down'" });
  }

  const all = await prisma.solution.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = all.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Solution not found" });

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) {
    return res.json({ ok: true }); // already at the edge, no-op
  }

  [all[index], all[swapWith]] = [all[swapWith], all[index]];

  await prisma.$transaction(
    all.map((s, i) => prisma.solution.update({ where: { id: s.id }, data: { sortOrder: i } }))
  );

  res.json({ ok: true });
});

export default router;