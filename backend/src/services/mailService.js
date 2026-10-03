import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function getTransport() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.mailFrom) return null;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

export async function sendPasswordResetOtp({ to, otp }) {
  const transport = getTransport();
  if (!transport) {
    throw new Error("Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM.");
  }

  await transport.sendMail({
    from: env.mailFrom,
    to,
    subject: "Your SkillForge password reset code",
    text: `Your SkillForge password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  });
}
