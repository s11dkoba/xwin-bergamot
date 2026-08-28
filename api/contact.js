/* Contact form delivery, over the same route the Japanese site already uses:
   Brevo's transactional email API. The key lives in the BREVO_API_KEY
   environment variable on Vercel and never reaches the browser.

   Mail is sent from info@x-win.io (which must be a verified sender in the
   Brevo account) to info@x-win.io, with reply-to set to the enquirer, so a
   reply in the mail client goes straight back to them. */

const TO = 'info@x-win.io';
const FROM = 'info@x-win.io';
const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const LIMITS = { name: 200, company: 200, email: 320, message: 5000 };

/* strips control characters (header injection, stray newlines in the
   subject) but leaves ordinary spacing alone */
function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

/* the message is a body, not a header: its line breaks are content, so
   everything else goes but U+000A stays */
function cleanBody(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n?/g, '\n')
          .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
          .trim().slice(0, max);
}

/* deliberately permissive — the point is to catch typos, not to police
   what is a valid address */
function looksLikeEmail(v) {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(v);
}

function escapeHtml(v) {
  return v.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'bad_request' });
  }

  /* a field no person sees; anything that fills it is not a person. Answer
     as though it went through, so the sender learns nothing. */
  if (clean(body.website, 100)) return res.status(200).json({ ok: true });

  const name    = clean(body.name, LIMITS.name);
  const company = clean(body.company, LIMITS.company);
  const email   = clean(body.email, LIMITS.email);
  const message = cleanBody(body.message, LIMITS.message);

  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!message) missing.push('message');
  if (missing.length) return res.status(400).json({ error: 'missing', fields: missing });
  if (!looksLikeEmail(email)) return res.status(400).json({ error: 'bad_email' });

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.error('BREVO_API_KEY is not set');
    return res.status(503).json({ error: 'not_configured' });
  }

  const rows = [
    ['Name', name],
    ['Company', company || '—'],
    ['Email', email]
  ];

  const text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') +
               '\n\n' + message + '\n\n— sent from the English site (xwin-bergamot)';

  const html = '<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">' +
    rows.map(function (r) {
      return '<tr><td style="color:#666">' + r[0] + '</td><td><b>' + escapeHtml(r[1]) + '</b></td></tr>';
    }).join('') +
    '</table><hr style="border:0;border-top:1px solid #ddd;margin:16px 0">' +
    '<div style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">' + escapeHtml(message) + '</div>' +
    '<p style="font-family:sans-serif;font-size:12px;color:#888">Sent from the English site (xwin-bergamot).</p>';

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': key,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'XWIN website', email: FROM },
        to: [{ email: TO }],
        replyTo: { email: email, name: name },
        subject: 'Website enquiry — ' + (company || name),
        textContent: text,
        htmlContent: html
      })
    });

    if (!r.ok) {
      /* log the provider's reason for us; tell the browser nothing about it */
      console.error('brevo responded ' + r.status + ': ' + (await r.text()).slice(0, 500));
      return res.status(502).json({ error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact send threw: ' + ((e && e.message) || e));
    return res.status(502).json({ error: 'send_failed' });
  }
};
