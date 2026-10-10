import { fmtDay, fmtTime } from "./time";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3600";

type Mail = { to: string; subject: string; html: string; text: string };

/** Sends through Resend. Without a key (local dev) the mail is printed instead. */
export async function sendMail({ to, subject, html, text }: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || "Hapnin <tickets@playnative.fun>", to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend said ${res.status}: ${await res.text()}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Email clients are stuck in 2004, so: tables and inline styles.
function layout(body: string) {
  return `<!doctype html><html><body style="margin:0;background:#0f0e0c;padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:#f3eee3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#191814;border:1px solid #2b2925;border-radius:24px">
<tr><td style="padding:28px 28px 0;font-size:20px;font-weight:700;letter-spacing:-0.5px">hapnin<span style="color:#d7ff3d">*</span></td></tr>
${body}
<tr><td style="padding:24px 28px 28px;font-size:12px;line-height:18px;color:#8d877c">Every school event in one place.<br><a href="${site()}" style="color:#8d877c">${site().replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function loginCodeMail(code: string) {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  return {
    subject: `${spaced} is your Hapnin code`,
    text: `Your Hapnin sign-in code is ${code}. It works for 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
    html: layout(`
<tr><td style="padding:24px 28px 8px;font-size:15px;line-height:22px;color:#cfc9bd">Here's your sign-in code. It works for the next 10 minutes.</td></tr>
<tr><td style="padding:8px 28px"><div style="background:#d7ff3d;color:#0f0e0c;border-radius:16px;padding:18px 0;text-align:center;font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:8px">${spaced}</div></td></tr>
<tr><td style="padding:16px 28px 0;font-size:13px;line-height:20px;color:#8d877c">Didn't ask for this? Ignore it. Nobody can sign in without the code.</td></tr>`),
  };
}

type TicketMailInput = { code: string; name: string; seats: number; title: string; venue: string; starts_at: string; slug: string };

export function ticketMail(t: TicketMailInput) {
  const url = `${site()}/tickets/${t.code}`;
  const when = `${fmtDay(t.starts_at)} · ${fmtTime(t.starts_at)}`;
  return {
    subject: `Your ticket: ${t.title}`,
    text: `Hi ${t.name},\n\nYou're in for ${t.title}.\n${when}\n${t.venue}\nTicket code: ${t.code} (admits ${t.seats})\n\nShow the QR at the door: ${url}`,
    html: layout(`
<tr><td style="padding:24px 28px 0;font-size:15px;line-height:22px;color:#cfc9bd">Hi ${esc(t.name.split(" ")[0])}, you're in.</td></tr>
<tr><td style="padding:12px 28px 0;font-size:28px;line-height:32px;font-weight:700;letter-spacing:-0.8px">${esc(t.title)}</td></tr>
<tr><td style="padding:8px 28px 0;font-size:14px;line-height:20px;color:#cfc9bd">${esc(when)}<br>${esc(t.venue)}</td></tr>
<tr><td style="padding:20px 28px 0" align="center"><div style="background:#f3eee3;border-radius:18px;padding:16px;display:inline-block">
<img src="${site()}/api/tickets/${t.code}/qr" width="180" height="180" alt="Ticket QR code" style="display:block"></div></td></tr>
<tr><td style="padding:14px 28px 0;text-align:center;font-family:'Courier New',monospace;font-size:16px;letter-spacing:3px">${t.code}</td></tr>
<tr><td style="padding:4px 28px 0;text-align:center;font-size:12px;color:#8d877c">Admits ${t.seats}</td></tr>
<tr><td style="padding:20px 28px 0" align="center"><a href="${url}" style="background:#d7ff3d;color:#0f0e0c;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:999px;display:inline-block">Open ticket</a></td></tr>`),
  };
}
