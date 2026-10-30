import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

type Email = { to: string; subject: string; html: string; text: string };

let transporter: Transporter | undefined;

function smtp(): Transporter | undefined {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } = env();
  if (!EMAIL_HOST || !EMAIL_USERNAME || !EMAIL_PASSWORD) return undefined;
  if (!transporter) {
    const port = EMAIL_PORT ?? 587;
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port,
      secure: port === 465,
      auth: { user: EMAIL_USERNAME, pass: EMAIL_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Sends an email through SMTP. Without SMTP settings, development prints the
 * email (including its links) to the server console; production refuses, so a
 * missing configuration is noticed rather than silently dropping invites.
 *
 * @returns true if the email was actually sent, false if it was only printed.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const transport = smtp();
  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured: set EMAIL_HOST, EMAIL_USERNAME and EMAIL_PASSWORD.");
    }
    console.info(`\n[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}\n`);
    return false;
  }
  const { EMAIL_FROM, EMAIL_USERNAME } = env();
  await transport.sendMail({
    from: EMAIL_FROM || `"Sleeky CMS" <${EMAIL_USERNAME}>`,
    ...email,
  });
  return true;
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Branded email layout matching the website's transactional emails. */
export function emailLayout({ heading, body, action, footer }: { heading: string; body: string; action?: { label: string; url: string }; footer: string }) {
  const button = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#58D68D;color:#070B10;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">${escapeHtml(action.label)}</a></p>
       <p style="margin:0;font-size:13px;line-height:1.5;color:#5F6E7C">Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(action.url)}</span></p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F4F6F8;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden">
    <div style="background:#070B10;padding:28px 32px;border-bottom:3px solid #58D68D">
      <div style="font-size:22px;font-weight:bold;color:#FFFFFF">Sleeky <span style="color:#58D68D">CMS</span></div>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#070B10">${escapeHtml(heading)}</h1>
      ${body}
      ${button}
    </div>
    <div style="padding:20px 32px;background:#F4F6F8;font-size:13px;line-height:1.5;color:#5F6E7C">
      <p style="margin:0 0 6px">${escapeHtml(footer)}</p>
      <p style="margin:0">&copy; ${new Date().getFullYear()} Sleeky Programmers Ltd · 20 Olanrewaju Street, Akoka, Lagos</p>
    </div>
  </div>
</body>
</html>`;
}
