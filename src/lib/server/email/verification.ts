import {
  MAIL_PROVIDER,
  GMAIL_USER,
  GOOGLE_APP_PASSWORD,
  BETTER_AUTH_URL,
  SMTP_FROM
} from "$app/env/private";

import nodemailer from "nodemailer";

function getTransporter() {
  const useGmail = MAIL_PROVIDER === "gmail" || !!GMAIL_USER && !!GOOGLE_APP_PASSWORD;

  if (useGmail) {
    if (!GMAIL_USER || !GOOGLE_APP_PASSWORD) {
      return null;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GOOGLE_APP_PASSWORD }
    });

    return transporter;
  }
}

function toAbsoluteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (!BETTER_AUTH_URL) {
    return url;
  }

  return new URL(url, BETTER_AUTH_URL).toString();
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const from = SMTP_FROM ?? GMAIL_USER;
  const absoluteUrl = toAbsoluteUrl(verificationUrl);
  const smtp = getTransporter();

  if (!smtp || !from) {
    [
      !GMAIL_USER && "GMAIL_USER",
      !GOOGLE_APP_PASSWORD && "GOOGLE_APP_PASSWORD",
      !from && "SMTP_FROM/GMAIL_USER"
    ];

    console.warn(
      "[Auth] Mail provider is not configured. Verification email was not sent.",
    );

    console.info(`[Auth] Verification link for ${to}: ${absoluteUrl}`);
    return;
  }

  try {
    await smtp.sendMail({
      from,
      to,
      subject: "Verify your email",
      text: `Verify your email by opening this link: ${absoluteUrl}`,
      html: `<p>Verify your email by opening this link:</p><p><a href="${absoluteUrl}">${absoluteUrl}</a></p>`,
    });
    console.info(`[Auth] Verification email sent to ${to}`);
  } catch (error) {
    console.error("[Auth] Failed to send verification email.", error);
    console.info(`[Auth] Fallback verification link for ${to}: ${absoluteUrl}`);
    throw error;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = SMTP_FROM ?? GMAIL_USER;
  const absoluteUrl = toAbsoluteUrl(resetUrl);
  const smtp = getTransporter();

  if (!smtp || !from) {
    console.warn(
      "[Auth] Mail provider is not configured. Reset password email was not sent.",
    );
    console.info(`[Auth] Password reset link for ${to}: ${absoluteUrl}`);
    return;
  }

  try {
    await smtp.sendMail({
      from,
      to,
      subject: "Reset your password",
      text: `Reset your password by opening this link: ${absoluteUrl}`,
      html: `<p>Reset your password by opening this link:</p><p><a href="${absoluteUrl}">${absoluteUrl}</a></p>`,
    });
    console.info(`[Auth] Password reset email sent to ${to}`);
  } catch (error) {
    console.error("[Auth] Failed to send password reset email.", error);
    console.info(`[Auth] Fallback password reset link for ${to}: ${absoluteUrl}`);
    throw error;
  }
}
