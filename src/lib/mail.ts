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

type TicketMailInput = { code: string; name: string; seats: number; title: string; venue: string; starts_at: string; slug: string; cover: string };

// Same look as the ticket on the site: photo on top, cream paper, perforation, QR stub.
// Email-safe: tables, inline styles, a JPG cover (Outlook can't do webp) and the QR as a PNG.
export function ticketMail(t: TicketMailInput) {
  const url = `${site()}/tickets/${t.code}`;
  const cover = t.cover.startsWith("/img/") ? `${site()}${t.cover.replace(/\.webp$/, "-mail.jpg")}` : t.cover;
  const ink = "#0f0e0c";
  const paper = "#f3eee3";
  const mono = "'Courier New',Courier,monospace";
  const label = (s: string) => `<div style="font-family:${mono};font-size:11px;letter-spacing:1px;color:#8d877c;text-transform:uppercase">${s}</div>`;
  const value = (s: string) => `<div style="font-family:${mono};font-size:14px;letter-spacing:0.5px;color:${ink};text-transform:uppercase;padding-top:4px">${esc(s)}</div>`;
  const notch = (side: "l" | "r") =>
    `<td width="14" style="width:14px;height:28px;background:${ink};border-radius:${side === "l" ? "0 14px 14px 0" : "14px 0 0 14px"};font-size:0;line-height:0">&nbsp;</td>`;

  const html = `<!doctype html><html><body style="margin:0;background:${ink};padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:${paper}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:400px">
<tr><td style="padding:0 4px 18px;font-size:20px;font-weight:700;letter-spacing:-0.5px">hapnin<span style="color:#d7ff3d">*</span></td></tr>
<tr><td style="padding:0 4px 20px;font-size:15px;line-height:22px;color:#cfc9bd">Hi ${esc(t.name.split(" ")[0])}, you're in. Here's your ticket, show the QR at the gate.</td></tr>

<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};border-radius:26px;border-collapse:separate">
<tr><td background="${cover}" height="170" valign="top" style="height:170px;background:#26241f url('${cover}') center/cover no-repeat;border-radius:26px 26px 0 0;padding:16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:138px">
  <tr><td valign="top"><span style="display:inline-block;background:${ink};color:${paper};font-family:${mono};font-size:11px;font-weight:700;letter-spacing:1.5px;padding:7px 12px;border-radius:999px">ADMIT ${t.seats}</span></td></tr>
  <tr><td valign="bottom" align="right"><span style="display:inline-block;background:rgba(15,14,12,0.55);color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.4px;padding:6px 12px;border-radius:999px">hapnin<span style="color:#d7ff3d">*</span></span></td></tr>
  </table>
</td></tr>

<tr><td style="padding:22px 24px 0;font-size:26px;line-height:30px;font-weight:700;letter-spacing:-0.8px;color:${ink}">${esc(t.title)}</td></tr>
<tr><td style="padding:18px 24px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" valign="top">${label("Date")}${value(fmtDay(t.starts_at))}</td>
    <td width="50%" valign="top">${label("Time")}${value(fmtTime(t.starts_at))}</td>
  </tr></table>
</td></tr>
<tr><td style="padding:16px 24px 0">${label("Venue")}${value(t.venue)}</td></tr>
<tr><td style="padding:16px 24px 0">${label("Guest")}${value(t.name)}</td></tr>

<tr><td style="padding:22px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${notch("l")}<td style="padding:0 10px"><div style="border-top:2px dashed #c9c2b4;height:0;line-height:0;font-size:0">&nbsp;</div></td>${notch("r")}
  </tr></table>
</td></tr>

<tr><td style="padding:18px 24px 24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="112" valign="middle"><img src="${site()}/api/tickets/${t.code}/qr" width="100" height="100" alt="Ticket QR code" style="display:block;border:0"></td>
    <td valign="middle" style="padding-left:12px">
      ${label("Ticket code")}
      <div style="font-family:${mono};font-size:22px;font-weight:700;letter-spacing:1px;color:${ink};padding:6px 0">${t.code}</div>
      ${label("Show this at the gate")}
    </td>
  </tr></table>
</td></tr>
</table>
</td></tr>

<tr><td align="center" style="padding:24px 0 0"><a href="${url}" style="background:#d7ff3d;color:${ink};text-decoration:none;font-weight:700;font-size:14px;padding:14px 26px;border-radius:999px;display:inline-block">Open ticket</a>
&nbsp; <a href="${site()}/api/events/${t.slug}/ics" style="color:#cfc9bd;font-size:14px;padding:14px 10px;display:inline-block">Add to calendar</a></td></tr>
<tr><td style="padding:28px 4px 0;font-size:12px;line-height:18px;color:#8d877c">Every school event in one place.<br><a href="${site()}" style="color:#8d877c">${site().replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;

  return {
    subject: `Your ticket: ${t.title}`,
    text: `Hi ${t.name},\n\nYou're in for ${t.title}.\n${fmtDay(t.starts_at)} · ${fmtTime(t.starts_at)}\n${t.venue}\nTicket code: ${t.code} (admits ${t.seats})\n\nShow the QR at the door: ${url}`,
    html,
  };
}
