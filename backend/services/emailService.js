import { Resend } from 'resend';
import crypto from 'crypto';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(email, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📧  Email verification (DEV — set RESEND_API_KEY to send real emails)`);
    console.log(`    User  : ${email}`);
    console.log(`    Open  : ${verifyUrl}`);
    console.log(`${'─'.repeat(60)}\n`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'SoictStock <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your SoictStock account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="background:#1B3BFC;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 18L11 12L15 15L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="21" cy="8" r="2" fill="#22C55E"/>
            </svg>
          </div>
          <h1 style="color:#111827;font-size:22px;margin:16px 0 4px;">Verify your email</h1>
          <p style="color:#6b7280;font-size:14px;margin:0;">Click the button below to activate your SoictStock account.</p>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${verifyUrl}" style="background:#1B3BFC;color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;display:inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
