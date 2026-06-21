/* Vercel serverless function — POST /api/notify-subscribers
   Called from admin dashboard to email all subscribers about a new session.
   Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY env vars.
*/
const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* Verify the caller is an authenticated admin (Supabase JWT) */
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const jwt = authHeader.replace('Bearer ', '');

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  /* Validate JWT against Supabase */
  const { data: { user }, error: authError } = await db.auth.getUser(jwt);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { session_id, message } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  /* Fetch session */
  const { data: session, error: sErr } = await db
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .single();
  if (sErr || !session) return res.status(404).json({ error: 'Session not found' });

  /* Fetch all subscribers */
  const { data: subscribers, error: subErr } = await db
    .from('subscribers')
    .select('email');
  if (subErr) return res.status(500).json({ error: subErr.message });
  if (!subscribers.length) return res.status(200).json({ sent: 0 });

  const resend = new Resend(process.env.RESEND_API_KEY);

  const dateStr = session.date
    ? new Date(session.date).toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Singapore' })
    : '';
  const timeStr = session.time ? ` at ${session.time} SGT` : '';
  const medium  = { in_person: 'In-person', online: 'Online', hybrid: 'Hybrid (in-person + online)' }[session.medium] || '';
  const regUrl  = `https://mana-initiative.sg/sessions/${session.slug}`;

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#232318;">
    <div style="background:#16331C;padding:2rem;text-align:center;">
      <h1 style="color:#C2A14A;font-size:1.5rem;margin:0;">The Ma'na Initiative</h1>
      <p style="color:rgba(246,232,210,.7);margin:.5rem 0 0;font-size:.875rem;">New session announcement</p>
    </div>
    <div style="padding:2rem;">
      <h2 style="color:#16331C;font-size:1.5rem;">${session.title}</h2>
      ${session.book_title ? `<p style="color:#6B6A55;margin:.5rem 0;">Reading: <em>${session.book_title}</em>${session.book_author ? ` by ${session.book_author}` : ''}</p>` : ''}
      <table style="margin:1.5rem 0;width:100%;border-collapse:collapse;">
        <tr><td style="padding:.5rem 0;color:#6B6A55;font-size:.875rem;width:80px;">Date</td><td style="padding:.5rem 0;">${dateStr}${timeStr}</td></tr>
        <tr><td style="padding:.5rem 0;color:#6B6A55;font-size:.875rem;">Medium</td><td style="padding:.5rem 0;">${medium}</td></tr>
        ${session.location ? `<tr><td style="padding:.5rem 0;color:#6B6A55;font-size:.875rem;">Venue</td><td style="padding:.5rem 0;">${session.location}</td></tr>` : ''}
      </table>
      ${session.description ? `<p style="line-height:1.7;">${session.description}</p>` : ''}
      ${message ? `<p style="background:#F6E8D2;padding:1rem;border-radius:.5rem;margin:1.5rem 0;">${message}</p>` : ''}
      <div style="text-align:center;margin:2rem 0;">
        <a href="${regUrl}" style="background:#16331C;color:#F6E8D2;padding:.875rem 2rem;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">Register for this session</a>
      </div>
    </div>
    <div style="background:#F6E8D2;padding:1.5rem;text-align:center;font-size:.75rem;color:#6B6A55;">
      You're receiving this because you subscribed to Ma'na session announcements.<br>
      <a href="mailto:hello@mana-initiative.sg" style="color:#16331C;">Unsubscribe</a>
    </div>
  </div>`;

  const emails = subscribers.map(s => s.email);
  /* Send in batches to respect rate limits */
  const BATCH = 50;
  let sent = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    await resend.emails.send({
      from:    'The Ma\'na Initiative <sessions@mana-initiative.sg>',
      bcc:     batch,
      to:      'sessions@mana-initiative.sg',
      subject: `New session: ${session.title}`,
      html,
    });
    sent += batch.length;
  }

  return res.status(200).json({ sent });
};
