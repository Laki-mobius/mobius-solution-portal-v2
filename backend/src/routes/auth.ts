import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import dns from "dns/promises";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "zoho.com",
  "gmx.com",
  "yandex.com",
  "rediffmail.com",
];

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function isSuspiciousDomain(domain: string): boolean {
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return true;
  // Catch near-miss typosquats (e.g. yaho.com, gmial.com, outlok.com)
  return BLOCKED_EMAIL_DOMAINS.some((blocked) => {
    // Only compare domains of similar length to avoid false positives on short/unrelated domains
    if (Math.abs(domain.length - blocked.length) > 2) return false;
    return levenshtein(domain, blocked) <= 1;
  });
}

async function hasValidMailServer(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false; // no MX records, or domain doesn't exist at all
  }
}

const RegisterSchema = CredentialsSchema.refine(
  (data) => {
    const domain = data.email.split("@")[1]?.toLowerCase();
    return domain && !isSuspiciousDomain(domain);
  },
  { message: "Please use your official work email — personal email providers (and look-alike domains) aren't allowed" }
);

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

// Register a new user (role defaults to "user")
router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid email or password (min 8 chars)";
    return res.status(400).json({ error: message });
  }

  const { email, password } = parsed.data;
  const emailLower = email.trim().toLowerCase();
  const domain = emailLower.split("@")[1];

  const validMailServer = await hasValidMailServer(domain);
  if (!validMailServer) {
    return res.status(400).json({ error: "This email domain doesn't appear to have valid email service — please use your real work email" });
  }

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: emailLower, passwordHash, role: "user" },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Login
router.post("/login", async (req, res) => {
  const parsed = CredentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email or password" });

  const { email, password } = parsed.data;
  const emailLower = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.put("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  res.json({ ok: true });
});

export default router;