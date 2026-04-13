// /api/leads/:id — update + delete
const AT = (env, id) =>
  `https://api.airtable.com/v0/${env.AIRTABLE_BASE}/${env.AIRTABLE_TABLE}/${id}`;

const headers = (env) => ({
  'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
  'Content-Type': 'application/json',
});

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

export async function onRequestPatch({ request, env, params }) {
  const body = await request.json();
  const fields = {};
  if ('name' in body) fields.Name = body.name;
  if ('business' in body) fields.Business = body.business;
  if ('email' in body) fields.Email = body.email;
  if ('source' in body) fields.Source = body.source;
  if ('score' in body) fields.Score = body.score;
  if ('stage' in body) fields.Stage = body.stage;
  if ('notes' in body) fields.Notes = body.notes;

  const r = await fetch(AT(env, params.id), {
    method: 'PATCH',
    headers: headers(env),
    body: JSON.stringify({ typecast: true, fields }),
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status });
  return Response.json(flatten(await r.json()));
}

export async function onRequestDelete({ env, params }) {
  const r = await fetch(AT(env, params.id), {
    method: 'DELETE',
    headers: headers(env),
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status });
  return Response.json({ deleted: true });
}