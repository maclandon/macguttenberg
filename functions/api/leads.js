// /api/leads  — list all + create new
// Env vars required (set in Cloudflare Pages → Settings → Environment variables):
//   AIRTABLE_TOKEN, AIRTABLE_BASE, AIRTABLE_TABLE

const AT = (env, path = '') =>
  `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}${path}`;

const headers = (env) => ({
  'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json',
});

// Convert Airtable record → flat lead object the frontend expects
const flatten = (r) => ({
  id: r.id,
  name: r.fields.Name || '',
  business: r.fields.Business || '',
  email: r.fields.Email || '',
  source: r.fields.Source || 'Other',
  score: r.fields.Score || '',
  stage: r.fields.Stage || 'New Lead',
  notes: r.fields.Notes || '',
  created: r.fields.Created || r.createdTime,
});

export async function onRequestGet({ env }) {
  const all = [];
  let offset;
  do {
    const url = new URL(AT(env));
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const r = await fetch(url, { headers: headers(env) });
    if (!r.ok) return new Response(await r.text(), { status: r.status });
    const j = await r.json();
    all.push(...j.records.map(flatten));
    offset = j.offset;
  } while (offset);
  return Response.json(all);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const r = await fetch(AT(env), {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      typecast: true,
      fields: {
        Name: body.name || '',
        Business: body.business || '',
        Email: body.email || '',
        Source: body.source || 'Other',
        Score: body.score || '',
        Stage: body.stage || 'New Lead',
        Notes: body.notes || '',
        Created: new Date().toISOString(),
      },
    }),
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status });
  const j = await r.json();
  return Response.json(flatten(j));
}