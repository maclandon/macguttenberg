// /api/contact — PUBLIC endpoint for the website contact form
// Writes new leads into Airtable. No read access, no auth required.
// Includes basic spam protection (honeypot field).

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

  // Honeypot — bots fill in hidden fields, humans don't
  if (body.website && body.website.trim() !== '') {
    return Response.json({ ok: true }); // pretend success, silently drop
  }

  // Basic validation
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  if (!name || !email) {
    return new Response('Name and email required', { status: 400 });
  }

  const notes = [
    body.type ? `Need: ${body.type}` : null,
    body.message ? `\n${body.message}` : null,
  ].filter(Boolean).join('');

  const fields = {
    Name: name,
    Business: (body.business || '').trim(),
    Email: email,
    Source: 'Onboarding Form',
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
    return new Response('Could not save submission', { status: 500 });
  }

  return Response.json({ ok: true });
}