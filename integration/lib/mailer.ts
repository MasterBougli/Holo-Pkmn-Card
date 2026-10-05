import nodemailer from "nodemailer";
import { buildAuthEmail, type AuthEmailPurpose } from "@/lib/auth-email";

export async function sendAuthEmail(to: string, subject: string, url: string, purpose: AuthEmailPurpose) {
  const host = process.env.SMTP_HOST;
  if (!host && process.env.NODE_ENV !== "production") {
    console.info(`[GeeckosCollector] ${subject} pour ${to}: ${url}`);
    return;
  }
  if (!host) throw new Error("La configuration SMTP est requise pour envoyer les e-mails d’authentification.");
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT doit être un port valide.");
  }
  if (Boolean(process.env.SMTP_USER) !== Boolean(process.env.SMTP_PASSWORD)) {
    throw new Error("SMTP_USER et SMTP_PASSWORD doivent être configurés ensemble.");
  }
  const transporter = nodemailer.createTransport({
    host,
    name: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").hostname,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "GeeckosCollector <noreply@booster.bougli.fr>",
    to,
    headers: { "Auto-Submitted": "auto-generated" },
    ...buildAuthEmail(subject, url, purpose),
  });
}
