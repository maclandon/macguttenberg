// /api/assessment — PUBLIC endpoint for the assessment quiz
// Writes a new lead into Airtable with source=Assessment and score.

const AT = (env) =>
  `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}`;

const headers = (env) => ({
  'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json',
});

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  // Honeypot
  if (body.website && body.website.trim() !== '') {
    return Response.json({ ok: true });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  if (!name || !email) {
    return new Response('Name and email required', { status: 400 });
  }

  const score = (body.score || '').trim();      // e.g. "18/30"
  const summary = (body.summary || '').trim();  // diagnosis text
  const answers = (body.answers || '').trim();  // detail dump

  const notes = [
    summary ? `📊 ${summary}\n` : null,
    answers ? `\nAnswers:\n${answers}` : null,
  ].filter(Boolean).join('');

  const fields = {
    Name: name,
    Business: (body.business || '').trim(),
    Email: email,
    Source: 'Assessment',
    Score: score,
    Stage: 'New Lead',
    Notes: notes,
    Created: new Date().toISOString(),
  };

  const r = await fetch(AT(env), {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({ typecast: true, fields }),
  });

  if (!r.ok) {
    console.error('Airtable error:', await r.text());
    return new Response('Could not save', { status: 500 });
  }

  return Response.json({ ok: true });
}
