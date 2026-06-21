/* Vercel serverless function — POST /api/send-confirmation
   Sends a confirmation email after registration or join-interest submission.
   This is optional — forms work without it; this just adds a confirmation email.
   Requires: RESEND_API_KEY env var.
*/
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, name, email, session_title, session_date } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const resend = new Resend(process.env.RESEND_API_KEY);

  let subject, html;
  if (type === 'registration') {
    subject = `You're registered: ${session_title}`;
    html = `<div style="font-family:system-ui;max-width:600px;margin:0 auto;">
      <div style="background:#16331C;padding:2rem;text-align:center;"><h1 style="color:#C2A14A;margin:0;">The Ma'na Initiative</h1></div>
      <div style="padding:2rem;">
        <p>Assalamu'alaikum ${name || 'there'},</p>
        <p>You're registered for <strong>${session_title}</strong>${session_date ? ` on ${session_date}` : ''}.</p>
        <p>We'll send any updates (venue change, Zoom link, etc.) to this email. See you there, insya'Allah.</p>
        <p>If you have questions, reply to this email or contact us at <a href="mailto:hello@mana-initiative.sg">hello@mana-initiative.sg</a>.</p>
        <p>Wassalam,<br>The Ma'na Initiative Committee</p>
      </div>
    </div>`;
  } else {
    subject = "Welcome to The Ma'na Initiative";
    html = `<div style="font-family:system-ui;max-width:600px;margin:0 auto;">
      <div style="background:#16331C;padding:2rem;text-align:center;"><h1 style="color:#C2A14A;margin:0;">The Ma'na Initiative</h1></div>
      <div style="padding:2rem;">
        <p>Assalamu'alaikum ${name || 'there'},</p>
        <p>Thank you for your interest in joining The Ma'na Initiative! We've added you to our community list.</p>
        <p>We'll be in touch when the next session is scheduled. In the meantime, check out our <a href="https://mana-initiative.sg/sessions">sessions page</a> and <a href="https://mana-initiative.sg/booklist">booklist</a>.</p>
        <p>We look forward to reading together, insya'Allah.</p>
        <p>Wassalam,<br>The Ma'na Initiative Committee</p>
      </div>
    </div>`;
  }

  try {
    await resend.emails.send({
      from:    "The Ma'na Initiative <hello@mana-initiative.sg>",
      to:      email,
      subject,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-confirmation error:', err);
    return res.status(500).json({ error: err.message });
  }
};
