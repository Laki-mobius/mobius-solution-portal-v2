import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

const router = Router();

// Admin: list all users
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  res.json(users);
});

// Admin: change a user's role
router.put("/:id/role", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const { role } = req.body as { role?: string };
  if (role !== "user" && role !== "admin") {
    return res.status(400).json({ error: "role must be 'user' or 'admin'" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

// Admin: delete a user (cannot delete yourself)
router.delete("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

const ResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

// Admin: reset a user's password directly
router.put("/:id/reset-password", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id as string }, data: { passwordHash } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;