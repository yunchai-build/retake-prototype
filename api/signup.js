export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Email: email,
          'Signed Up At': new Date().toISOString(),
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    console.error('Airtable error:', err);
    return res.status(500).json({ error: 'Failed to save' });
  }

  return res.status(200).json({ ok: true });
}
