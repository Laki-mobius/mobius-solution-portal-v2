import { Router } from "express";
import { prisma } from "../lib/prisma";
import { decryptCredential } from "../lib/crypto";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Reveal credentials for a solution (any logged-in user)
router.post("/:id/reveal-credentials", requireAuth, async (req: AuthedRequest, res) => {
  const solutionId = req.params.id as string;
  const email = req.user!.email;

  const solution = await prisma.solution.findUnique({ where: { id: solutionId } });
  if (!solution) return res.status(404).json({ error: "Solution not found" });
  if (solution.status === "archived") return res.status(403).json({ error: "Solution unavailable" });
  if (!solution.defaultPasswordEncrypted && !solution.defaultUsername) {
    return res.status(404).json({ error: "No credentials" });
  }

  let password: string | null = null;
  if (solution.defaultPasswordEncrypted) {
    try {
      password = decryptCredential(solution.defaultPasswordEncrypted);
    } catch {
      return res.status(500).json({ error: "Decrypt failed" });
    }
  }

  await prisma.credentialReveal.create({
    data: { solutionId, email },
  });
  await prisma.activityLog.create({
    data: { email, action: "reveal_credentials", targetId: solutionId, targetType: "solution" },
  });

  res.json({
    username: solution.defaultUsername,
    password,
    note: solution.credentialsNote,
  });
});

export default router;